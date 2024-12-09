import React, { useState } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";

interface PhoneInputProps {
  onSubmit: (phone: string) => void;
  isLoading?: boolean;
}

export const PhoneInput = ({ onSubmit, isLoading }: PhoneInputProps) => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+996\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validatePhone(phone)) {
      setError("Введите корректный номер телефона в формате +996XXXXXXXXX");
      return;
    }

    onSubmit(phone);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="tel"
        label="Номер телефона"
        placeholder="+996XXXXXXXXX"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        errorMessage={error}
        isInvalid={!!error}
      />
      <Button
        type="submit"
        color="primary"
        isLoading={isLoading}
        className="w-full"
      >
        Получить код
      </Button>
    </form>
  );
};
