import type { StartAvatarResponse } from "@heygen/streaming-avatar";

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
} from "@heygen/streaming-avatar";
import { Microphone } from "@icon-park/react";
import { Button, Tooltip, Spinner } from "@nextui-org/react";
import { Close } from "@icon-park/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";

import AvatarTextInput from "./AvatarTextInput";

import {
  AVATAR_ID,
  VOICE_ID,
  PROMPT,
  WELCOME,
  CHAT_MODE,
} from "@/app/lib/constants";

const previewImage = "/giuseppe-landscape.png";


export default function InteractiveAvatar() {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingSpeak, setIsLoadingSpeak] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUserTalking, setIsUserTalking] = useState(false);

  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();

  const [data, setData] = useState<StartAvatarResponse>();
  const [text, setText] = useState<string>("");
  const [help, setHelp] = useState<string>();
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  const [chatMode, setChatMode] = useState(CHAT_MODE.TEXT);

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();

      console.log("Access Token:", token); // Log the token to verify

      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
    }

    return "";
  }

  async function startSession() {
    setIsLoadingSession(true);
    const newToken = await fetchAccessToken();

    avatar.current = new StreamingAvatar({
      token: newToken,
    });
    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
      console.log("Avatar started talking", e);
    });
    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
      console.log("Avatar stopped talking", e);
    });
    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log("Stream disconnected");
      endSession();
    });
    avatar.current?.on(StreamingEvents.STREAM_READY, (event) => {
      console.log(">>>>> Stream ready:", event.detail);
      setStream(event.detail);
    });
    avatar.current?.on(StreamingEvents.USER_START, (event) => {
      console.log(">>>>> User started talking:", event);
      setIsUserTalking(true);
    });
    avatar.current?.on(StreamingEvents.USER_STOP, (event) => {
      console.log(">>>>> User stopped talking:", event);
      setIsUserTalking(false);
    });
    try {
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: AVATAR_ID,
        voice: {
          voiceId: VOICE_ID,
        },
        knowledgeBase: PROMPT,
        //disableIdleTimeout: true,
      });

      setData(res);
    } catch (error) {
      console.error("Error starting avatar session:", error);
      setHelp("Error starting avatar session");
    } finally {
      setIsLoadingSession(false);
    }
  }
  async function handleSpeak() {
    setIsLoadingSpeak(true);
    if (!avatar.current) {
      setDebug("Avatar API not initialized");

      return;
    }
    await avatar.current
      .speak({ text: text, taskType: TaskType.TALK, taskMode: TaskMode.SYNC })
      .catch((e) => {
        setDebug(e.message);
      });
    setIsLoadingSpeak(false);
  }

  async function handleInterrupt() {
    if (!avatar.current) {
      setDebug("Avatar API not initialized");

      return;
    }
    await avatar.current.interrupt().catch((e) => {
      setDebug(e.message);
    });
  }

  async function endSession() {
    await avatar.current?.stopAvatar();
    setStream(undefined);
  }

  async function handleChangeChatMode() {
    if (chatMode === CHAT_MODE.VOICE) {
      avatar.current?.closeVoiceChat();
      setChatMode(CHAT_MODE.TEXT);
    } else {
      await avatar.current?.startVoiceChat({
        useSilencePrompt: false,
      });
      setChatMode(CHAT_MODE.VOICE);
    }
  }

  useEffect(() => {
    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
        setIsPlaying(true);
        setDebug("Playing");
        speakWelcomeMessage();
      };
    }
  }, [mediaStream, stream]);


  async function speakWelcomeMessage() {
    if (!avatar.current) {
      console.error("Avatar not ready yet");

      return;
    }

    await avatar.current.speak({ text: WELCOME }).catch((e) => {
      setDebug(e.message);
    });
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col justify-center items-center">
        {stream ? (
          <div className="justify-center items-center flex rounded-none sm:rounded-lg overflow-hidden relative w-full max-w-full sm:h-auto h-[80vh] sm:aspect-video">
            <video
              ref={mediaStream}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              poster={previewImage}
            >
              <track kind="captions" />
            </video>

            <div className="flex flex-col gap-2 absolute top-3 right-3">
              <Button
                color="default"
                isIconOnly={true}
                radius="md"
                size="lg"
                variant="light"
                onClick={endSession}
              >
                <Close />
              </Button>
            </div>

            {isPlaying && (
              <div className="absolute bottom-6 min-w-full w-full px-6">
                <div className="flex w-full items-center">
                  <div className="flex flex-row justify-center h-full w-full gap-2">
                    <Tooltip
                      color="foreground"
                      content={
                        chatMode == CHAT_MODE.TEXT
                          ? "Chat with voice"
                          : "Stop recording"
                      }
                      showArrow={true}
                    >
                      <Button
                        isIconOnly
                        className={clsx(
                          "text-white",
                          chatMode == CHAT_MODE.TEXT ? "bg-primary" : "",
                        )}
                        isDisabled={false}
                        size="lg"
                        variant="solid"
                        onClick={handleChangeChatMode}
                      >
                        {chatMode == CHAT_MODE.TEXT ? (
                          <Microphone size={20} />
                        ) : (
                          <>
                            <div className="absolute h-full w-full bg-red-500 animate-pulse -z-10" />
                            ⏹
                          </>
                        )}
                      </Button>
                    </Tooltip>
                    <AvatarTextInput
                      isDisabled={!mediaStream || chatMode == CHAT_MODE.VOICE}
                      isLoading={isLoadingSession}
                      isUserTalking={isUserTalking}
                      placeholder={
                        chatMode == CHAT_MODE.TEXT
                          ? "Type or press the mic to talk to me"
                          : "Listening. Press ⏹ to stop recording."
                      }
                      setValue={setText}
                      value={text}
                      onSubmit={() => {
                        if (!text) {
                          setDebug("Please enter text to chat with me");
                          setHelp("Please enter text to chat with me");

                          return;
                        }
                        handleSpeak();
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="justify-center items-center flex rounded-none sm:rounded-lg overflow-hidden relative w-full max-w-full sm:h-auto h-[80vh] sm:aspect-video">
            <img
              alt="Giuseppe avatar"
              className="w-full h-full object-cover"
              draggable="false"
              src={previewImage}
            />
            {isLoadingSession ? (
              <div className="flex justify-center items-center absolute">
                <Spinner color="primary" size="lg" />
              </div>
            ) : (
              <div className="flex flex-col gap-2 absolute bottom-8 sm:bottom-16">
                <Button
                  className="w-full text-white hover:bg-primary-hover/100"
                  color="primary"
                  radius="full"
                  size="lg"
                  variant="solid"
                  onClick={startSession}
                >
                  Chat with AI Giuseppe
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center items-center">
        <article className="text-wrap text-center w-[380px] text-black/50 text-xs">
          <p className="pb-4">
            AI Giuseppe is powered by cutting-edge technology that’s constantly
            evolving to bring you the most advanced experience.
          </p>
          <p className="pb-4">
            As with all innovations, there might be occasional hiccups along the
            way. AI Giuseppe may hallucinate.
          </p>
          <p>
            For critical information, it’s always best to verify with
            <br />
            the{" "}
            <Link
              className="underline"
              href="https://giuseppestigliano.com/#contact"
            >
              real Giuseppe here
            </Link>
            .
          </p>
          <p className="max-w-fit font-sans">{help}</p>
        </article>
      </div>
    </div>
  );
}
