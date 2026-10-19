import type { ButtonHTMLAttributes, Ref } from "react";
import { Icon, type IconName } from "@/components/Icon/Icon";
import styles from "./Button.module.css";

// Figma: Button/primary · Button/secondary · Button/ghost. Heights from size/tap-primary (56) and size/tap-min (48).
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "lg" | "md" | "sm";
  icon?: IconName;
  ref?: Ref<HTMLButtonElement>;
};

export const Button = ({ variant = "primary", size = "lg", icon, className, children, type = "button", ...rest }: ButtonProps) => (
  <button
    type={type}
    className={[styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ")}
    {...rest}
  >
    {icon && <Icon name={icon} size={20} />}
    <span className={styles.label}>{children}</span>
  </button>
);
