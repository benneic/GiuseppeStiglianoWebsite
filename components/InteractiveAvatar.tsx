import { AVATAR_ID, VOICE_ID, PROMPT, WELCOME } from "@/app/lib/constants";
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
import { Microphone, MicrophoneStage } from "@phosphor-icons/react";
import { useChat } from "ai/react";
import clsx from "clsx";
import OpenAI from "openai";
import { useEffect, useRef, useState } from "react";
import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function InteractiveAvatar() {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const [avatarSessionData, setAvatarSessionData] = useState<NewSessionData>();
  const [initialized, setInitialized] = useState(false); // Track initialization
  const [recording, setRecording] = useState(false); // Track recording state
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatarApi | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const previewImage = "https://files2.heygen.ai/avatar/v3/" + AVATAR_ID + "/full/2.2/preview_target.webp";

  const { messages, input, setInput, handleSubmit } = useChat({
    onFinish: async (message) => {
      console.log("ChatGPT Response:", message);

      if (!initialized || !avatar.current) {
        setDebug("Avatar API not initialized");
        return;
      }

      //send the ChatGPT response to the Interactive Avatar
      await avatar.current
        .speak({
          taskRequest: { text: message.content, sessionId: avatarSessionData?.sessionId },
        })
        .catch((e) => {
          setDebug(e.message);
        });
      setIsLoadingChat(false);
      console.log("Messages", messages)
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
            voice: { voiceId: VOICE_ID },
          },
        },
        setDebug
      );
      setAvatarSessionData(res);
      setStream(avatar.current.mediaStream);
    } catch (error) {
      console.error("Error starting avatar session:", error);
      setDebug(
        `There was an error starting the session. ${VOICE_ID ? "This custom voice ID may not be supported." : ""}`
      );
    }
    setIsLoadingSession(false);
  }

  async function speakWelcomeMessage() {
    if (!initialized || !avatar.current) {
      console.error("Avatar not ready yet");
      return;
    }
    await avatar.current
      .speak({ taskRequest: { text: WELCOME, sessionId: avatarSessionData?.sessionId } })
      .catch((e) => {
        setDebug(e.message);
      });
  }


  async function updateToken() {
    const newToken = await fetchAccessToken();
    console.log("Updating Access Token:", newToken); // Log token for debugging
    avatar.current = new StreamingAvatarApi(
      new Configuration({ accessToken: newToken })
    );

    const startTalkCallback = (e: any) => {
      console.log("Avatar started talking", e);
    };

    const stopTalkCallback = (e: any) => {
      console.log("Avatar stopped talking", e);
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
      .interrupt({ interruptRequest: { sessionId: avatarSessionData?.sessionId } })
      .catch((e) => {
        setDebug(e.message);
      });
  }

  async function endSession() {
    setIsPlaying(false);

    if (recording) {
      stopRecording();
      mediaRecorder.current = null;
    }
    if (isLoadingChat) {
      setIsLoadingChat(false);
    }

    // stop all voice recording
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(streams => {
        streams.getTracks().forEach(track => {
          track.stop();
        });
      })

    // stop avatar
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    await avatar.current.stopAvatar(
      { stopSessionRequest: { sessionId: avatarSessionData?.sessionId } },
      setDebug
    );
    setStream(undefined);
  }

  useEffect(() => {
    async function init() {
      const newToken = await fetchAccessToken();
      console.log("Initializing with Access Token:", newToken); // Log token for debugging
      avatar.current = new StreamingAvatarApi(
        new Configuration({ accessToken: newToken, jitterBuffer: 200 })
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




  function startRecording() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder.current = new MediaRecorder(stream);

        mediaRecorder.current.ondataavailable = (event) => {
          console.log('Recieved audio chunk', event.data)
          audioChunks.current.push(event.data);
        };

        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, {
            type: "audio/wav",
          });
          console.log('Audio recording stopped')
          audioChunks.current = [];
          transcribeAudio(audioBlob);
        };
        /**
        We can provide the timeslice param to start() method to specify number of milliseconds to record into each Blob.
        Then ondataavailable method above will be called on each timeslice
        We could then send each slice to whisper and see what it returns
        https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start
        **/
        mediaRecorder.current.start();
        setRecording(true);
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });
  }

  function stopRecording() {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);
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
              className="w-full h-full object-cover"
              ref={mediaStream}
              autoPlay
              playsInline
              poster={previewImage}
            >
              <track kind="captions" />
            </video>

            <div className="flex flex-col gap-2 absolute top-3 right-3">
              <Button
                size="md"
                onClick={handleInterrupt}
                className="bg-primary-background text-white rounded-lg"
                variant="shadow"
              >
                Interrupt task
              </Button>
              <Button
                size="md"
                onClick={endSession}
                className="bg-primary-background  text-white rounded-lg"
                variant="shadow"
              >
                End session
              </Button>
            </div>

            {isPlaying &&
              <div className="flex flex-col absolute bottom-6 min-w-full px-6">
                <InteractiveAvatarTextInput
                  label="Chat"
                  placeholder="Please type or record your voice"
                  input={input}
                  onSubmit={() => {
                    setIsLoadingChat(true);
                    if (!input) {
                      setDebug("Please enter text to chat with me");
                      return;
                    }
                    handleSubmit();
                  }}
                  setInput={setInput}
                  loading={isLoadingChat}
                  endContent={
                    <Tooltip
                      content={!recording ? "Start recording" : "Stop recording"}
                    >
                      <Button
                        onClick={!recording ? startRecording : stopRecording}
                        isDisabled={!stream}
                        isIconOnly
                        className={clsx(
                          "mr-4 text-white",
                          !recording
                            ? "bg-primary-background"
                            : ""
                        )}
                        size="sm"
                        variant="shadow"
                      >
                        {!recording ? (
                          <Microphone size={20} />
                        ) : (
                          <>
                            <div className="absolute h-full w-full bg-primary-background animate-pulse -z-10"></div>
                            <MicrophoneStage size={20} />
                          </>
                        )}
                      </Button>
                    </Tooltip>
                  }
                  disabled={!stream}
                />
              </div>
            }
          </div>
        ) : (
          <div className="justify-center items-center flex rounded-none sm:rounded-lg overflow-hidden relative w-full max-w-full sm:h-auto h-[80vh] sm:aspect-video">
            <img
              className="w-full h-full object-cover"
              draggable="false"
              src={previewImage}
              alt="Giuseppe avatar">
            </img>
            {isLoadingSession ? (
              <div className="flex justify-center items-center absolute">
                <Spinner size="lg" color="danger" />
              </div>
            ) :
              (
                <div className="flex flex-col gap-2 absolute bottom-8">
                  <Button
                    size="md"
                    onClick={startSession}
                    className="bg-primary-background w-full text-white"
                    variant="shadow"
                  >
                    Start session
                  </Button>
                </div>
              )}
          </div>
        )}
      </div>
      <div className="justify-center items-center flex overflow-hidden w-full max-w-full">
        <article className="text-wrap text-left w-full">
          <h3>Transcript</h3>
          <p className="max-w-fit font-sans">{}</p>
        </article>
      </div>
    </div>
  );
}
