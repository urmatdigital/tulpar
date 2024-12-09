import React from "react";
import { Button } from "@nextui-org/button";
import { TelegramIcon } from "@/components/icons/TelegramIcon";

interface TelegramLoginButtonProps {
  botUsername: string;
  onAuth?: (user: any) => void;
}

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: any) => void;
    };
  }
}

export const TelegramLoginButton = ({
  botUsername,
  onAuth,
}: TelegramLoginButtonProps) => {
  React.useEffect(() => {
    if (onAuth) {
      window.TelegramLoginWidget = {
        dataOnauth: (user: any) => onAuth(user),
      };
    }

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-onauth", "TelegramLoginWidget.dataOnauth(user)");
    script.async = true;

    const container = document.getElementById("telegram-login-container");
    if (container) {
      container.appendChild(script);
    }

    return () => {
      if (container && script) {
        container.removeChild(script);
      }
    };
  }, [botUsername, onAuth]);

  return (
    <div>
      <Button
        variant="flat"
        color="primary"
        startContent={<TelegramIcon />}
        className="w-full mb-4"
      >
        Войти через Telegram
      </Button>
      <div id="telegram-login-container" className="hidden" />
    </div>
  );
};
