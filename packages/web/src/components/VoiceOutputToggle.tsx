import React, { useState } from 'react';

interface VoiceOutputToggleProps {
  initialValue?: boolean;
  onToggle: (value: boolean) => void;
}

const VoiceOutputToggle: React.FC<VoiceOutputToggleProps> = ({
  initialValue = false,
  onToggle,
}) => {
  const [voiceOutput, setVoiceOutput] = useState(initialValue);

  const handleToggle = () => {
    const newValue = !voiceOutput;
    setVoiceOutput(newValue);
    onToggle(newValue);
  };

  return (
    <button
      className="rounded bg-gray-200 px-4 py-2 text-xl font-bold text-gray-800 hover:bg-gray-300"
      onClick={handleToggle}>
      {voiceOutput ? '音声出力: ON' : '音声出力: OFF'}
    </button>
  );
};


export default VoiceOutputToggle;