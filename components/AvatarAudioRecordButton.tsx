import { ArrowUp, Microphone } from "@icon-park/react";
import { Button, Tooltip } from "@nextui-org/react";
import clsx from "clsx";

interface AvatarAudioRecordButtonProps {
  startRecording: () => void;
  stopRecording: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  isRecording?: boolean;
}

export default function AvatarAudioRecordButton({
  startRecording,
  stopRecording,
  isDisabled,
  isRecording,
}: AvatarAudioRecordButtonProps) {
  return (
    <Tooltip
      color="foreground"
      content={!isRecording ? "Chat with voice" : "Stop recording"}
      showArrow={true}
    >
      <Button
        isIconOnly
        className={clsx("text-white", !isRecording ? "bg-primary" : "")}
        isDisabled={isDisabled}
        size="lg"
        variant="solid"
        onClick={!isRecording ? startRecording : stopRecording}
      >
        {!isRecording ? (
          <Microphone size={20} />
        ) : (
          <>
            <div className="absolute h-full w-full bg-primary animate-pulse -z-10" />
            <ArrowUp size="20" theme="outline" />
          </>
        )}
      </Button>
    </Tooltip>
  );
}
