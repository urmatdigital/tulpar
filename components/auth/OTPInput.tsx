import React, { useState, useRef, useEffect } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";

interface OTPInputProps {
  length?: number;
  onSubmit: (otp: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  resendTimeout?: number;
}

export const OTPInput = ({
  length = 6,
  onSubmit,
  onResend,
  isLoading,
  resendTimeout = 60,
}: OTPInputProps) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const [activeInput, setActiveInput] = useState(0);
  const [timeLeft, setTimeLeft] = useState(resendTimeout);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer =
      timeLeft > 0 && setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeLeft]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveInput(index + 1);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveInput(index - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length === length) {
      onSubmit(otpValue);
    }
  };

  const handleResend = () => {
    setTimeLeft(resendTimeout);
    onResend();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between gap-2">
        {otp.map((value, index) => (
          <Input
            key={index}
            type="text"
            maxLength={1}
            value={value}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-12 text-center"
            classNames={{
              input: "text-center",
            }}
          />
        ))}
      </div>
      <Button
        type="submit"
        color="primary"
        isLoading={isLoading}
        className="w-full"
        isDisabled={otp.join("").length !== length}
      >
        Подтвердить
      </Button>
      <Button
        type="button"
        variant="light"
        onPress={handleResend}
        isDisabled={timeLeft > 0}
        className="w-full"
      >
        {timeLeft > 0
          ? `Отправить код повторно через ${timeLeft}с`
          : "Отправить код повторно"}
      </Button>
    </form>
  );
};
