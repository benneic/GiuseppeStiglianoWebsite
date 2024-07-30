import { Input, Spinner, Tooltip } from "@nextui-org/react";
import { Airplane, ArrowRight, PaperPlaneRight } from "@phosphor-icons/react";
import clsx from "clsx";

interface StreamingAvatarTextInputProps {
  label: string;
  placeholder: string;
  input: string;
  onSubmit: () => void;
  setInput: (value: string) => void;
  endContent?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export default function InteractiveAvatarTextInput({
  label,
  placeholder,
  input,
  onSubmit,
  setInput,
  endContent,
  disabled = false,
  loading = false,
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
          input: ["text-black", "placeholder:text-black"],
          innerWrapper: "bg-primary-foreground",
          inputWrapper: [
            "shadow-xl",
            "bg-primary-foreground",
            "backdrop-blur-xl",
            "backdrop-saturate-200",
            "hover:bg-default-200/70",
            "dark:hover:bg-default/70",
            "group-data-[focus=true]:bg-default-200/50",
            "dark:group-data-[focus=true]:bg-default/60",
            "!cursor-text",
          ],
        }}
        endContent={
          <div className="flex flex-row items-center h-full">
            <Tooltip content="Send message">
              {loading ? (
                <Spinner
                  className="text-indigo-300 hover:text-indigo-200"
                  size="lg"
                  color="default"
                />
              ) : (
                <button
                  type="submit"
                  className="focus:outline-none"
                  onClick={handleSubmit}
                >
                  <PaperPlaneRight
                    className={clsx(
                      "text-indigo-300 hover:text-indigo-200",
                      disabled && "opacity-50"
                    )}
                    size={24}
                  />
                </button>
              )}
            </Tooltip>
          </div>
        }
        placeholder={placeholder}
        size="lg"
        value={input}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }
        }}
        onValueChange={setInput}
        isDisabled={disabled}
      />
      {endContent}
    </div>
  );
}
