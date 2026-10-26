
import { saveMessage, getMessages, updateMessage, deleteMessage } from './messageService';
import { db } from './databaseService';

// Global API service that consolidates various service functionalities
const globalApiService = {
  // Message-related functions
  messages: {
    save: saveMessage,
    get: getMessages,
    update: updateMessage,
    delete: deleteMessage
  },
  
  // Database-related functions
  database: {
    connect: (uri: string) => db.connect(uri),
    disconnect: () => db.disconnect(),
    runCommand: (command: any) => db.runCommand(command)
  }
};

export default globalApiService;
