"use client";

import InteractiveAvatar from "@/components/InteractiveAvatar";

export default function App() {
  return (
    <div className="flex flex-col items-start justify-start gap-5 mx-auto sm:pt-4 pb-20">
      <div className="w-full">
        <InteractiveAvatar />
      </div>
    </div>
  );
}
