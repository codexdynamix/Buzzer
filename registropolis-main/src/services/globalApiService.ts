
import { saveMessage, getMessages, updateMessage, deleteMessage } from './messageService';

// Global API service that consolidates various service functionalities
const globalApiService = {
  // Message-related functions
  messages: {
    save: saveMessage,
    get: getMessages,
    update: updateMessage,
    delete: deleteMessage
  },
};

export default globalApiService;
