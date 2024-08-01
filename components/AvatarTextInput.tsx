import { ArrowUp } from "@icon-park/react";
import { Button, Image, Input, Spinner, Tooltip } from "@nextui-org/react";

interface AvatarTextInputProps {
  placeholder: string;
  value: string;
  setValue: (value: string) => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  isRecording?: boolean;
  onSubmit: () => void;
}

export default function AvatarTextInput({
  placeholder,
  value,
  onSubmit,
  setValue,
  isDisabled = false,
  isLoading = false,
  isRecording = false,
}: AvatarTextInputProps) {
  function handleSubmit() {
    if (value.trim() === "") {
      return;
    }
    onSubmit();
    setValue("");
  }

  return (
    <div className="relative w-full sm:w-[480]">
      <input
        className="block w-full h-12 p-3 text-sm text-gray-900 rounded-large"
        disabled={isDisabled}
        placeholder={
          isRecording ? "Listening. Press ↑ to send your message." : placeholder
        }
        value={value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setValue(event.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }
        }}
      />
      <div className="absolute end-0.5 bottom-0.5 top-0.5">
        {isRecording ? (
          <Button
            className="h-11"
            color="primary"
            isDisabled={true}
            isIconOnly={true}
            radius="md"
            size="lg"
            variant="solid"
            onClick={handleSubmit}
          >
            <Image
              alt="Sound wave"
              className="h-11"
              src="/streaming-listening-tile.png"
              width={125}
            />
          </Button>
        ) : (
          <Tooltip color="foreground" content="Send message" showArrow={true}>
            {isLoading ? (
              <Spinner
                className="h-11 text-indigo-300 hover:text-indigo-200"
                color="primary"
                size="lg"
              />
            ) : (
              <Button
                className="h-11"
                color="primary"
                disabled={isDisabled}
                isIconOnly={true}
                radius="md"
                size="lg"
                variant="solid"
                onClick={handleSubmit}
              >
                <ArrowUp size="16" theme="outline" />
              </Button>
            )}
          </Tooltip>
        )}
      </div>
    </div>
  );
}


// onChange={(event: React.ChangeEvent<HTMLInputElement>) => {setValue(event.target.value);}}