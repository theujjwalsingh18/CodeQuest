import { toast } from 'sonner';

const useToast = () => {

  const showToast = (message, type = 'message', options = {}) => {
    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'info':
        toast.info(message, options);
        break;
      case 'warning':
        toast.warning(message, options);
        break;
      case 'message':
      default:
        toast(message, options);
        break;
    }
  };

  const successToast = (message, options) => toast.success(message, options);
  const errorToast = (message, options) => toast.error(message, options);
  const infoToast = (message, options) => toast.info(message, options);
  const warningToast = (message, options) => toast.warning(message, options);
  const genericToast = (message, options) => toast(message, options);

  return {
    showToast,
    successToast,
    errorToast,
    infoToast,
    warningToast,
    genericToast,
  };
};

export default useToast;