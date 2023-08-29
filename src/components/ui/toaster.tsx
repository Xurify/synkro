import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCcwIcon } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, Icon, iconClassname, ...props }) {
        return (
          <Toast key={id} {...props}>
            {Icon && (
              <span className={iconClassname ? `mr-4 ${iconClassname}` : "mr-4"}>
                <RefreshCcwIcon />
              </span>
            )}
            <div className="grid gap-1 mr-auto">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
