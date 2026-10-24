/* 模态弹层exterior壳: 遮罩, 浮层eseuno档面y圆角, dentro面uno React Aria `Dialog`. 
 *
 * Registrarse表dentroSin模态弹层, 用 React Aria  `Modal` 组合, 差异登记En `../boardui/ORIGIN.md`. 
 * 层级取遗Deja壳 `--layer-dialog`(`z-dialog`): 顶栏 y 侧栏各Con自己 z-index, 比 Tailwind
 * ese档 `z-50` 都alto, 遮罩压No住它们, 弹层开着时ese两还亮着. 
 *
 * ancho度按用途取uno档: 换Avataruno排cuatro候选, RecortarPortada放得abajoCompleto封套, Introduceuno表同
 * `ui-kit/modal.css` dentro `.ui-geist-modal`  540px. 
 *
 * página头izquierda边ese 56px Imagen标方也Enaquí(`ModalGlyph`): 它es弹层página头uno部分, Noes卡.  */
import type { ReactNode } from 'react';
import { useFocusVisible } from 'react-aria';
import { Dialog, Modal, ModalOverlay } from 'react-aria-components';

const WIDTH = {
  'avatar-picker': 'max-w-avatar-picker',
  'cover-crop': 'max-w-cover-crop',
  form: 'max-w-form-modal',
  collections: 'max-w-4xl',
} as const;

export function ModalFrame({ isOpen, onOpenChange, width, label, children }: {
  isOpen: boolean;
  onOpenChange(open: boolean): void;
  width: keyof typeof WIDTH;
  /** 弹层Sin `Heading slot="title"` 时Sin障碍名称.  */
  label?: string;
  children: ReactNode;
}) {
  const { isFocusVisible } = useFocusVisible();
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable
      data-modal-motion="" data-modal-kind={width} data-motion-instant={isFocusVisible || undefined}
      className="fixed inset-0 z-dialog flex items-center justify-center bg-scrim p-4">
      <Modal data-modal-surface="" data-modal-width={width} className={`flex max-h-full w-full ${WIDTH[width]} flex-col overflow-hidden rounded-2-5xl border border-separator-border bg-background-full shadow-dropdown`}>
        {/* 调用方自己正文滚动区收得abajo时esteuno层No滚; 矮视口dentro连página头加按钮都放Noabajo, 就Completo滚, 
            CerrarClaveTotal够得着.  */}
        <Dialog aria-label={label} className="flex min-h-0 flex-col overflow-y-auto overscroll-contain outline-none">{children}</Dialog>
      </Modal>
    </ModalOverlay>
  );
}

/** 弹层página头izquierda边方Imagen标槽, 字形由调用方给(`size-6`).  */
export function ModalGlyph({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-separator-border bg-background-secondary-default text-foreground-icon-secondary">
      {children}
    </span>
  );
}
