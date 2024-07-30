import { Button, Image, Input, Spinner, Tooltip } from "@nextui-org/react";
import { Airplane, ArrowRight, PaperPlaneRight } from "@phosphor-icons/react";
import clsx from "clsx";

import { ArrowUp } from "@icon-park/react";

interface StreamingAvatarTextInputProps {
  placeholder: string;
  input: string;
  onSubmit: () => void;
  setInput: (value: string) => void;
  endContent?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  recording?: boolean;
}

export default function InteractiveAvatarTextInput({
  placeholder,
  input,
  onSubmit,
  setInput,
  endContent,
  disabled = false,
  loading = false,
  recording = false,
}: StreamingAvatarTextInputProps) {
  function handleSubmit() {
    if (input.trim() === "") {
      return;
    }
    onSubmit();
    setInput("");
  }

  return (
    <div className="flex flex-row justify-center h-full w-full gap-2">
      <Input
        classNames={{
          base: "max-w-prose",
          input: ["text-black", "placeholder:text-black/200"],
          innerWrapper: "bg-primary-foreground",
          inputWrapper: [
            "shadow-xl",
            "bg-primary-foreground",
            "dark:bg-primary-foreground",
            "backdrop-blur-xl",
            "backdrop-saturate-200",
            "group-data-[has-value=true]:text-default-foreground",
            "hover:bg-primary-foreground",
            "dark:hover:bg-primary-foreground",
            "group-data-[focus=true]:bg-primary-foreground",
            "dark:group-data-[focus=true]:bg-primary-foreground",
            "!cursor-text",
            "border-0",
            "data-[hover=true]:border-0",
            "group-data-[focus=true]:border-0",
          ],
        }}
        endContent={
          <div className="flex flex-row items-center h-full mr-[-6]">
            {recording ? (
              <Button
                color="primary"
                isIconOnly={true}
                radius="md"
                size="md"
                variant="solid"
                onClick={handleSubmit}
              >
                <Image
                  alt="Sound wave"
                  src="/streaming-listening-tile.png"
                  width={125}
                />
              </Button>
            ) : (
              <Tooltip color="foreground" content="Send message" showArrow={true}>
                {loading ? (
                  <Spinner
                    className="text-indigo-300 hover:text-indigo-200"
                    color="primary"
                    size="lg"
                  />
                ) : (
                  <Button
                    color="primary"
                    isIconOnly={true}
                    radius="md"
                    size="md"
                    variant="solid"
                    onClick={handleSubmit}
                  >
                    <ArrowUp theme="outline" size="16" />
                  </Button>
                )}
              </Tooltip>
            )}
          </div>
        }
        isDisabled={disabled || recording}
        placeholder={placeholder}
        size="lg"
        value={input}
        variant="bordered"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }
        }}
        onValueChange={setInput}
      />
      {endContent}
    </div>
  );
}
