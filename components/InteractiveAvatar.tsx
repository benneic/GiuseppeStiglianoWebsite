import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents, TaskType, VoiceEmotion,
} from "@heygen/streaming-avatar";
import { Button, Select, SelectItem, Spinner } from "@nextui-org/react";
import { Close } from "@icon-park/react";
import { useChat } from "ai/react";
import OpenAI from "openai";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
  const [chatInput, setChatInput] = useState<string>("");
  const [chatResponse, setChatResponse] = useState<string>("");
  const [isUserTalking, setIsUserTalking] = useState(false);

  const [debug, setDebug] = useState<string>();
  const [help, setHelp] = useState<string>();

  const [avatarStream, setAvatarStream] = useState<MediaStream | null>();
  //const [avatarSessionData, setAvatarSessionData] = useState<NewSessionData>();
  const [initialized, setInitialized] = useState(false); // Track initialization
  const avatarStreamRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<StreamingAvatar | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream>();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const previewImage = "/giuseppe-landscape.png";

  /** When chat input changes, set Chat GPT input */
  useEffect(() => {
    if (chatInput && chatInput.trim() !== "" && chatInput != input) {
      setInput(chatInput);
    }
  }, [chatInput]);

  /** when the chat response changes, send it to the Avatar */
  useEffect(() => {
    if (!initialized || !avatarRef.current) {
      setDebug("Avatar API not initialized");

      return;
    }

    if (!chatResponse) {
      console.error("Empty chat response");

      return;
    }

    if (isSpeaking) {
      handleInterrupt();
    }

    let dialogue = splitString(chatResponse, 980);

    for (const text of dialogue) {
      //send the ChatGPT response to the Interactive Avatar
      avatarRef.current
        .speak({
          text: text,
          task_type: TaskType.TALK,
        })
        .catch((e) => {
          setDebug(e.message);
        });
    }
  }, [chatResponse]);

  /** Generate chat response from ChatGPT from chat input */
  const { messages, input, setInput, handleSubmit } = useChat({
    onFinish: async (message) => {
      console.log("ChatGPT Response:", message);
      setChatResponse(message.content);
      setIsLoadingChat(false);
      setChatInput("");
    },
    initialMessages: [
      {
        id: "1",
        role: "system",
        content: PROMPT,
      },
    ],
  });

  function handleChat() {
    setChatResponse(chatInput);
    setIsLoadingChat(false);
    setChatInput("");
  }

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
    const newToken = await fetchAccessToken();

    avatarRef.current = new StreamingAvatar({
      token: newToken,
    });

    avatarRef.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
      console.log("Avatar started talking", e);
      setIsSpeaking(true);
    });

    avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
      console.log("Avatar stopped talking", e);
      setIsSpeaking(false);
    });

    avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log("Stream disconnected");
      endSession();
    });
    avatarRef.current?.on(StreamingEvents.STREAM_READY, (event) => {
      console.log(">>>>> Stream ready:", event.detail);
      setAvatarStream(event.detail);
      setIsLoadingSession(false);
    });
    avatarRef.current?.on(StreamingEvents.USER_START, (event) => {
      console.log(">>>>> User started talking:", event);
      setIsUserTalking(true);
    });
    avatarRef.current?.on(StreamingEvents.USER_STOP, (event) => {
      console.log(">>>>> User stopped talking:", event);
      setIsUserTalking(false);
    });

    try {
      console.log("Starting Avatar:", AVATAR_ID);
      await avatarRef.current.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: AVATAR_ID,
        voice: {
          voiceId: VOICE_ID,
        },
        knowledgeBase: PROMPT,
      });
    } catch (error) {
      console.error("Error starting avatar session:", error);
      setDebug(
        `There was an error starting the session. ${VOICE_ID ? "This custom voice ID may not be supported." : ""}`,
      );
    } finally {
      setInitialized(true);
    }
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
      //handleSubmit();
      handleChat();

      return;
    }

    await avatarRef.current.speak({ text: WELCOME }).catch((e) => {
      setDebug(e.message);
    });
  }

  async function handleInterrupt() {
    if (!initialized || !avatarRef.current) {
      setDebug("Avatar API not initialized");

      return;
    }
    await avatarRef.current.interrupt().catch((e) => {
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
    await avatarRef.current.stopAvatar();
    setAvatarStream(undefined);
  }

  useEffect(() => {
    async function init() {
      const newToken = await fetchAccessToken();

      //console.log("Initializing with Access Token:", newToken); // Log token for debugging
      avatarRef.current = new StreamingAvatar({
        token: newToken,
      });
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

  /** Send the input to Chat GPT as soon as transcription is set in chat input */
  useEffect(() => {
    if (!isTranscriptionWaiting) {
      return;
    }
    // send the input immediately
    if (input.trim() !== "") {
      setIsLoadingChat(true);
      //handleSubmit();
      handleChat();
    }
    setIsTranscriptionWaiting(false);
  }, [input]);

  /** record audio from the browser and set the result to the chat input */
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

          setIsTranscriptionWaiting(true);

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
      setChatInput(transcription);
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // stop all voice recording
      audioStream?.getTracks().forEach((track) => track.stop());
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
                      isDisabled={!avatarStream}
                      isLoading={isLoadingChat}
                      isRecording={isRecording}
                      placeholder="Type or press the mic to talk"
                      setValue={setChatInput}
                      value={chatInput}
                      onSubmit={() => {
                        if (!input) {
                          setDebug("Please enter text to chat with me");
                          setHelp("Please enter text to chat with me");

                          return;
                        }
                        setIsLoadingChat(true);
                        //handleSubmit();
                        handleChat();
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
      <div className="flex flex-col justify-center items-center">
        <article className="text-wrap text-center w-[380px] text-black/50 text-xs">
          <p>
            Made by{" "}
            <Link className="underline" href="https://unevenfutures.com">
              UnevenFutures.com
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
