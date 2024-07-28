import React, { useState } from 'react';
import Message, { MessageProps } from './Message';


interface TranscriptProps {
    messages: [MessageProps];
}

export default function Transcript({ messages }: TranscriptProps) {
    return (
        <div>
            {messages.map((msg, index) => (
                <Message key={index} message={msg.message} isUser={msg.isUser} />
            ))}
        </div>
    )
}