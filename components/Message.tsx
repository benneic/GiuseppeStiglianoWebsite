
export interface MessageProps {
  message: string;
  isUser: boolean;
}

export default function Message({ message, isUser }: MessageProps) {
  return (
    <div className="">
      <div className="max-w-fit p-2 rounded-lg text-left break-words">
        {message}
      </div>
    </div>
  );
}
