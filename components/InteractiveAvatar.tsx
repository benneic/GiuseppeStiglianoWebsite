import {
  Configuration,
  NewSessionData,
  StreamingAvatarApi,
} from "@heygen/streaming-avatar";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Input,
  Select,
  SelectItem,
  Spinner,
  Tooltip,
} from "@nextui-org/react";
import {
  BracketsAngle,
  Microphone,
  MicrophoneStage,
} from "@phosphor-icons/react";
import { Close } from "@icon-park/react";
import { useChat } from "ai/react";
import clsx from "clsx";
import OpenAI from "openai";
import { useEffect, useRef, useState } from "react";

import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";

import { AVATAR_ID, VOICE_ID, PROMPT, WELCOME } from "@/app/lib/constants";
import { splitString } from "@/app/lib/helpers";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function InteractiveAvatar() {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // Track recording state
  const [isRecordingWaiting, setIsRecordingWaiting] = useState(false); // Track if we are waiting for avatar to stop speking before recording
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const [help, setHelp] = useState<string>();
  const [avatarSessionData, setAvatarSessionData] = useState<NewSessionData>();
  const [initialized, setInitialized] = useState(false); // Track initialization
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatarApi | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const previewImage = "/giuseppe-landscape.png";

  const { messages, input, setInput, handleSubmit } = useChat({
    onFinish: async (message) => {
      console.log("ChatGPT Response:", message);

      if (!initialized || !avatar.current) {
        setDebug("Avatar API not initialized");

        return;
      }

      let dialogue = splitString(message.content, 1000);

      for (const text of dialogue) {
        //send the ChatGPT response to the Interactive Avatar
        await avatar.current
          .speak({
            taskRequest: {
              text: text,
              sessionId: avatarSessionData?.sessionId,
            },
          })
          .catch((e) => {
            setDebug(e.message);
          });
      };

      setIsLoadingChat(false);
      console.log("Messages", messages);
    },
    initialMessages: [
      {
        id: "1",
        role: "system",
        content: PROMPT,
      },
    ],
  });

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

      return "";
    }
  }

  async function startSession() {
    setIsLoadingSession(true);
    await updateToken();
    if (!avatar.current) {
      setDebug("Avatar API is not initialized");
      return;
    }
    try {
      console.log("Starting Avatar:", AVATAR_ID);
      const res = await avatar.current.createStartAvatar(
        {
          newSessionRequest: {
            quality: "high",
            avatarName: AVATAR_ID,
            voice: { voiceId: VOICE_ID, emotion: "Excited", rate: 0.96 },
            knowledgeBase: PROMPT,
          },
        },
        setDebug,
      );

      setAvatarSessionData(res);
      setStream(avatar.current.mediaStream);
    } catch (error) {
      console.error("Error starting avatar session:", error);
      setDebug(
        `There was an error starting the session. ${VOICE_ID ? "This custom voice ID may not be supported." : ""}`,
      );
    }
    setIsLoadingSession(false);
  }

  async function speakWelcomeMessage() {
    if (!initialized || !avatar.current) {
      console.error("Avatar not ready yet");
      return;
    }

    // only say welcome message on first session
    // otherwise get avatar to say hello again
    if (messages.length > 1) {
      setInput("Please say hello again");
      handleSubmit();

      return;
    }

    await avatar.current
      .speak({
        taskRequest: { text: WELCOME, sessionId: avatarSessionData?.sessionId },
      })
      .catch((e) => {
        setDebug(e.message);
      });
  }

  async function updateToken() {
    const newToken = await fetchAccessToken();

    console.log("Updating Access Token:", newToken); // Log token for debugging

    avatar.current = new StreamingAvatarApi(
      new Configuration({ accessToken: newToken }),
    );

    const startTalkCallback = (e: any) => {
      console.log("Avatar started talking", e);

      setIsSpeaking(true);
    };

    const stopTalkCallback = (e: any) => {
      console.log("Avatar stopped talking", e);

      setIsSpeaking(false);
    };

    console.log("Adding event handlers:", avatar.current);
    avatar.current.addEventHandler("avatar_start_talking", startTalkCallback);
    avatar.current.addEventHandler("avatar_stop_talking", stopTalkCallback);

    setInitialized(true);
  }

  async function handleInterrupt() {
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    await avatar.current
      .interrupt({
        interruptRequest: { sessionId: avatarSessionData?.sessionId },
      })
      .catch((e) => {
        setDebug(e.message);
      });
  }

  async function endSession() {
    setIsPlaying(false);

    if (isRecording) {
      stopRecording();
      mediaRecorder.current = null;
    }
    if (isLoadingChat) {
      setIsLoadingChat(false);
    }

    // stop avatar
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");

      return;
    }
    await avatar.current.stopAvatar(
      { stopSessionRequest: { sessionId: avatarSessionData?.sessionId } },
      setDebug,
    );
    setStream(undefined);
  }

  useEffect(() => {
    async function init() {
      const newToken = await fetchAccessToken();
      console.log("Initializing with Access Token:", newToken); // Log token for debugging
      avatar.current = new StreamingAvatarApi(
        new Configuration({ accessToken: newToken, jitterBuffer: 200 }),
      );
      setInitialized(true); // Set initialized to true
    }
    init();

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

  useEffect(() => {
    // hacky work around, SDK needs events for connection state
    if (debug == "ICE connection state changed to: disconnected") {
      endSession();
    }
  }, [debug]);

  // if we were waiting to record while avatar was speaking
  // check if it is time to record
  useEffect(() => {
    if (!isSpeaking && isRecordingWaiting) {
      setIsRecordingWaiting(false);
      startRecording();
    }
  }, [isSpeaking]);

  function startRecording() {
    if (isSpeaking) {
      setIsRecordingWaiting(true);
      handleInterrupt();

      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder.current = new MediaRecorder(stream);

        mediaRecorder.current.ondataavailable = (event) => {
          console.log("Recieved audio chunk", event.data);
          audioChunks.current.push(event.data);
        };

        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, {
            type: "audio/wav",
          });
          console.log("Audio recording stopped");
          audioChunks.current = [];
          transcribeAudio(audioBlob);
        };
        /**
        We can provide the timeslice param to start() method to specify number of milliseconds to record into each Blob.
        Then ondataavailable method above will be called on each timeslice
        We could then send each slice to whisper and see what it returns
        https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start
        **/
        mediaRecorder.current.start(5000); // Chunk every 5 seconds
        setIsRecording(true);
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);

        setHelp(
          "Error accessing microphone, please allow access via your address bar",
        );
      });
  }

  function stopRecording() {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);

      // stop all voice recording
      navigator.mediaDevices.getUserMedia({ audio: true }).then((streams) => {
        streams.getTracks().forEach((track) => {
          track.stop();
        });
      });
    }
  }

  async function transcribeAudio(audioBlob: Blob) {
    try {
      // Convert Blob to File
      const audioFile = new File([audioBlob], "recording.wav", {
        type: "audio/wav",
      });
      const response = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: audioFile,
      });
      const transcription = response.text;
      console.log("Transcription: ", transcription);

      // sends the transcript to ChatGPT and on completion sends to the HeyGen Avatar
      setInput(transcription);
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
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
                  <InteractiveAvatarTextInput
                    disabled={!stream}
                    endContent={
                      <Tooltip
                        color="foreground"
                        content={
                          !isRecording ? "Chat with voice" : "Stop recording"
                        }
                        showArrow={true}
                      >
                        <Button
                          isIconOnly
                          className={clsx(
                            "text-white",
                            !isRecording ? "bg-primary" : "",
                          )}
                          isDisabled={!stream}
                          size="lg"
                          variant="shadow"
                          onClick={
                            !isRecording ? startRecording : stopRecording
                          }
                        >
                          {!isRecording ? (
                            <Microphone size={20} />
                          ) : (
                            <>
                              <div className="absolute h-full w-full bg-primary animate-pulse -z-10" />
                              <MicrophoneStage size={20} />
                            </>
                          )}
                        </Button>
                      </Tooltip>
                    }
                    input={input}
                    loading={isLoadingChat}
                    placeholder="Type your message or press the mic to talk"
                    recording={isRecording}
                    setInput={setInput}
                    onSubmit={() => {
                      setIsLoadingChat(true);
                      if (!input) {
                        setDebug("Please enter text to chat with me");
                        return;
                      }
                      handleSubmit();
                    }}
                  />
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
              <div className="flex flex-col gap-2 absolute bottom-8">
                <Button
                  className="w-full text-white"
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
      <div className="justify-center items-center flex overflow-hidden w-full max-w-full">
        <article className="text-wrap text-left w-full">
          <p className="max-w-fit font-sans">{help}</p>
        </article>
      </div>
    </div>
  );
}
