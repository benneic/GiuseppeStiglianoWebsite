import {
  Configuration,
  NewSessionData,
  StreamingAvatarApi,
} from "@heygen/streaming-avatar";
import { Button, Spinner } from "@nextui-org/react";
import { Close } from "@icon-park/react";
import { useChat } from "ai/react";
import OpenAI from "openai";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";
import AvatarAudioRecordButton from "./AvatarAudioRecordButton";

import { AVATAR_ID, VOICE_ID, PROMPT, WELCOME } from "@/app/lib/constants";
import { splitString } from "@/app/lib/helpers";
import AvatarTextInput from "./AvatarTextInput";

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
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [isTranscriptionWaiting, setIsTranscriptionWaiting] = useState(true);
  const [avatarStream, setAvatarStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const [help, setHelp] = useState<string>();
  const [avatarSessionData, setAvatarSessionData] = useState<NewSessionData>();
  const [initialized, setInitialized] = useState(false); // Track initialization
  const avatarStreamRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<StreamingAvatarApi | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream>();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const previewImage = "/giuseppe-landscape.png";

  const { messages, input, setInput, handleSubmit } = useChat({
    onFinish: async (message) => {
      console.log("ChatGPT Response:", message);

      if (!initialized || !avatarRef.current) {
        setDebug("Avatar API not initialized");

        return;
      }

      let dialogue = splitString(message.content, 980);

      for (const text of dialogue) {
        //send the ChatGPT response to the Interactive Avatar
        await avatarRef.current
          .speak({
            taskRequest: {
              text: text,
              sessionId: avatarSessionData?.sessionId,
            },
          })
          .catch((e) => {
            setDebug(e.message);
          });
      }

      setIsLoadingChat(false);
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
    if (!avatarRef.current) {
      setDebug("Avatar API is not initialized");

      return;
    }
    try {
      console.log("Starting Avatar:", AVATAR_ID);
      const res = await avatarRef.current.createStartAvatar(
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
      setAvatarStream(avatarRef.current.mediaStream);
    } catch (error) {
      console.error("Error starting avatar session:", error);
      setDebug(
        `There was an error starting the session. ${VOICE_ID ? "This custom voice ID may not be supported." : ""}`,
      );
    }
    setIsLoadingSession(false);
  }

  async function speakWelcomeMessage() {
    if (!initialized || !avatarRef.current) {
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

    await avatarRef.current
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

    avatarRef.current = new StreamingAvatarApi(
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

    console.log("Adding event handlers:", avatarRef.current);
    avatarRef.current.addEventHandler(
      "avatar_start_talking",
      startTalkCallback,
    );
    avatarRef.current.addEventHandler("avatar_stop_talking", stopTalkCallback);

    setInitialized(true);
  }

  async function handleInterrupt() {
    if (!initialized || !avatarRef.current) {
      setDebug("Avatar API not initialized");

      return;
    }
    await avatarRef.current
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
      mediaRecorderRef.current = null;
    }
    if (isLoadingChat) {
      setIsLoadingChat(false);
    }

    // stop avatar
    if (!initialized || !avatarRef.current) {
      setDebug("Avatar API not initialized");

      return;
    }
    await avatarRef.current.stopAvatar(
      { stopSessionRequest: { sessionId: avatarSessionData?.sessionId } },
      setDebug,
    );
    setAvatarStream(undefined);
  }

  useEffect(() => {
    async function init() {
      const newToken = await fetchAccessToken();

      console.log("Initializing with Access Token:", newToken); // Log token for debugging
      avatarRef.current = new StreamingAvatarApi(
        new Configuration({ accessToken: newToken, jitterBuffer: 200 }),
      );
      setInitialized(true); // Set initialized to true
    }
    init();

    return () => {
      endSession();
    };
  }, []);

  // close all audio recorder tracks
  useEffect(() => {
    return () => {
      audioStream?.getTracks().forEach((track) => track.stop());
    };
  }, [audioStream]);

  useEffect(() => {
    if (avatarStream && avatarStreamRef.current) {
      try {
        avatarStreamRef.current.srcObject = avatarStream;
        avatarStreamRef.current.onloadedmetadata = () => {
          avatarStreamRef.current!.play();
          setIsPlaying(true);
          setDebug("Playing");
          speakWelcomeMessage();
        };
      } catch (error) {
        console.error("Error accessing player:", error);

        setHelp(
          "Error playing audio, please allow access via your address bar",
        );
      }
    }
  }, [avatarStreamRef, avatarStream]);

  useEffect(() => {
    // hacky work around, SDK needs events for connection state
    if (debug == "ICE connection state changed to: disconnected") {
      endSession();
    }
  }, [debug]);

  // if we were waiting to record while avatar was speaking
  // check if it is time to record
  useEffect(() => {
    if (isPlaying && isSpeaking && isRecordingWaiting) {
      handleInterrupt();
    } else if (!isSpeaking && isRecordingWaiting) {
      setIsRecordingWaiting(false);
      startRecording();
    }
  }, [isSpeaking, isRecordingWaiting]);

  useEffect(() => {
    if (!isTranscriptionWaiting) {
      return;
    }
    // send the input immediately
    if (input.trim() !== "") {
      setIsLoadingChat(true);
      handleSubmit();
      setIsTranscriptionWaiting(false);
    }
  }, [input, isTranscriptionWaiting]);

  function startRecording() {
    if (isSpeaking) {
      setIsRecordingWaiting(true);

      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setAudioStream(stream);
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
          console.log("Recieved audio chunk", event.data);
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          console.log("Audio recording stopped");

          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });

          audioChunksRef.current = [];

          const audioUrl = URL.createObjectURL(audioBlob);

          setAudioUrl(audioUrl);

          transcribeAudio(audioBlob);
        };
        /**
        We can provide the timeslice param to start() method to specify number of milliseconds to record into each Blob.
        Then ondataavailable method above will be called on each timeslice
        We could then send each slice to whisper and see what it returns
        https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start
        **/
        mediaRecorderRef.current.start(); // Chunk every 5 seconds
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
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // stop all voice recording
      audioStream?.getTracks().forEach((track) => track.stop());
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

      // set the translation into the input field
      setInput(transcription);

      setIsTranscriptionWaiting(true);
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col justify-center items-center">
        {avatarStream ? (
          <div className="justify-center items-center flex rounded-none sm:rounded-lg overflow-hidden relative w-full max-w-full sm:h-auto h-[80vh] sm:aspect-video">
            <video
              ref={avatarStreamRef}
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
                    <AvatarAudioRecordButton
                      isDisabled={
                        !initialized ||
                        !avatarRef.current ||
                        !avatarStream ||
                        !avatarStreamRef.current
                      }
                      isRecording={isRecording}
                      startRecording={startRecording}
                      stopRecording={stopRecording}
                    />
                    <AvatarTextInput
                      input={input}
                      isDisabled={!avatarStream}
                      isLoading={isLoadingChat}
                      isRecording={isRecording}
                      placeholder="Type or press the mic to talk"
                      setInput={setInput}
                      onSubmit={() => {
                        if (!input) {
                          setDebug("Please enter text to chat with me");
                          setHelp("Please enter text to chat with me");

                          return;
                        }
                        setIsLoadingChat(true);
                        handleSubmit();
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
      <div className="flex flex-col justify-center items-center">
        <article className="text-wrap text-center w-[380px] text-black/50 text-xs">
          <p>
            AI Giuseppe can hallucinate and make mistakes.
            <br />
            Consider checking important information with the{" "}
            <Link
              className="underline"
              href="https://giuseppestigliano.com/#contact"
            >
              real Giuseppe
            </Link>
            .
          </p>
          <p className="max-w-fit font-sans">{help}</p>
        </article>
      </div>
    </div>
  );
}

/***
 * Test out audio recordings for Safari with this
 *          {audioUrl && (
            <audio controls>
              <source src={audioUrl} />
              <track kind="captions" />
            </audio>
          )}
 * 
 */
