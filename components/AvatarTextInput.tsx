import { ArrowUp } from "@icon-park/react";
import { Button, Image, Input, Spinner, Tooltip } from "@nextui-org/react";

interface AvatarTextInputProps {
  placeholder: string;
  input: string;
  setInput: (value: string) => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  isRecording?: boolean;
  onSubmit: () => void;
}

export default function AvatarTextInput({
  placeholder,
  input,
  onSubmit,
  setInput,
  isDisabled = false,
  isLoading = false,
  isRecording = false,
}: AvatarTextInputProps) {
  function handleSubmit() {
    if (input.trim() === "") {
      return;
    }
    onSubmit();
    setInput("");
  }

  return (
    <div className="relative w-full sm:w-[480]">
      <input
        className="block w-full h-12 p-3 text-sm text-gray-900 rounded-large"
        disabled={isDisabled}
        placeholder={placeholder}
        value={input}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setInput(event.target.value);
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
            isIconOnly={true}
            radius="md"
            size="lg"
            variant="solid"
            onClick={handleSubmit}
            isDisabled={true}
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
