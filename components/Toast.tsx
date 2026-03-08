"use client";
import { createPortal } from "react-dom";
import styles from "./Toast.module.css";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  return createPortal(
    <div className={styles.toast}>
      <svg className={styles.icon} viewBox="0 0 111 111" xmlns="http://www.w3.org/2000/svg">
        <rect width="111" height="111" rx="5.55" fill="#0000FF" />
      </svg>
      <span className={styles.text}>{message}</span>
      <button className={styles.close} onClick={onClose}>
        ✕
      </button>
    </div>,
    document.body
  );
}
