/**
 * @/lib/db — Central database query module
 *
 * Import all database functions from this single entry point.
 * Example: import { createOrGetLead, logCall, saveMessage } from "@/lib/db"
 */

// Lead operations
export {
  createOrGetLead,
  assignLead,
  getLeadsByPriority,
  updateLeadStatus,
  getLeadById,
} from "./leads";

// Message / Chat history operations
export {
  saveMessage,
  markMessagesAsRead,
  getMessagesByLead,
  saveMessageBatch,
} from "./messages";

// Staff / Authentication operations
export {
  getStaffByEmail,
  getStaffByPhone,
  getAllStaff,
  createStaff,
  getAvailableCallers,
} from "./staff";

// Call log / Analytics operations
export {
  logCall,
  getCallsByLead,
  getCallsByStaff,
  getCallAnalytics,
} from "./calls";
