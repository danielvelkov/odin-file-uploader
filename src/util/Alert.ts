export type AlertType = 'success' | 'error' | 'warning' | 'info';

export class Alert {
  constructor(
    public type: AlertType,
    public title: string,
    public message: string,
  ) {}

  get icon(): string {
    return {
      success: 'fa fa-solid fa-check',
      error: 'fa fa-solid fa-times',
      warning: 'fa fa-solid fa-exclamation',
      info: 'fa fa-solid fa-info',
    }[this.type];
  }

  get color(): string {
    return {
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600',
    }[this.type];
  }

  get border(): string {
    return {
      success: 'border-green-300',
      error: 'border-red-300',
      warning: 'border-yellow-300',
      info: 'border-blue-300',
    }[this.type];
  }

  get bg(): string {
    return {
      success: 'bg-green-50',
      error: 'bg-red-50',
      warning: 'bg-yellow-50',
      info: 'bg-blue-50',
    }[this.type];
  }
}
