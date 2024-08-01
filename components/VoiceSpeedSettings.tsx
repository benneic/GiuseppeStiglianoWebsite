import { NewSessionRequestVoiceEmotionEnum } from "@heygen/streaming-avatar";
import { Select } from "@nextui-org/react";
import { useState } from "react";

export default function AvatarTextInput() {
  const [voice, setVoice] = useState<NewSessionRequestVoiceEmotionEnum>("Excited");
  const [speed, setSpeed] = useState<string>("1.00");

  const voices = [
    { voice: "Excited" },
    { voice: "Serious" },
    { voice: "Friendly" },
    { voice: "Soothing" },
    { voice: "Broadcaster" },
  ];

  const speeds = [
    { speed: "0.85" },
    { speed: "0.90" },
    { speed: "0.95" },
    { speed: "1.00" },
    { speed: "1.05" },
    { speed: "1.10" },
    { speed: "1.15" },
  ];

  return (
    <div className="flex flex-row justify-center items-center gap-4 p-4">
      <Select
        className="max-w-xs"
        isDisabled={!!avatarStream}
        items={voices}
        label="Voice emotion"
        placeholder="Select voice emotion"
        selectedKeys={new Set([voice])}
        selectionMode="single"
        onChange={(e) => {
          setVoice(e.target.value as NewSessionRequestVoiceEmotionEnum);
        }}
      >
        {(item) => <SelectItem key={item.voice}>{item.voice}</SelectItem>}
      </Select>
      <Select
        className="max-w-xs"
        isDisabled={!!avatarStream}
        items={speeds}
        label="Voice speed"
        placeholder="Select voice speed"
        selectedKeys={new Set([speed.toString()])}
        selectionMode="single"
        onChange={(e) => {
          setSpeed(e.target.value);
        }}
      >
        {(item) => <SelectItem key={item.speed}>{item.speed}</SelectItem>}
      </Select>
    </div>
  );
}