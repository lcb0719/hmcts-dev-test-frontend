import { TaskStatus } from '../types/task';

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

const STATUS_TAG_CLASSES: Record<TaskStatus, string> = {
  PENDING: 'govuk-tag--grey',
  IN_PROGRESS: 'govuk-tag--blue',
  COMPLETED: 'govuk-tag--green',
};

export function formatStatus(status: TaskStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusTagClass(status: TaskStatus): string {
  return STATUS_TAG_CLASSES[status] ?? '';
}

export function formatDueDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Converts HTML datetime-local value to backend format yyyy-MM-dd'T'HH:mm:ss */
export function toApiDateTime(value: string): string {
  if (!value) {
    return value;
  }
  if (value.length === 16) {
    return `${value}:00`;
  }
  return value;
}

/** Converts API datetime to value for datetime-local input */
export function toDatetimeLocalValue(iso: string): string {
  return iso?.slice(0, 16) ?? '';
}
