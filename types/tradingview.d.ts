interface TradingViewWidgetOptions {
  autosize: boolean;
  symbol: string;
  interval: string;
  timezone: string;
  theme: string;
  style: string;
  locale: string;
  toolbar_bg: string;
  enable_publishing: boolean;
  allow_symbol_change: boolean;
  container_id: string;
  hide_side_toolbar: boolean;
  hide_legend: boolean;
  studies: string[];
  charts_storage_api_version: string;
  client_id: string;
  user_id: string;
  fullscreen: boolean;
  show_popup_button: boolean;
  withdateranges: boolean;
  hide_volume: boolean;
  studies_overrides: {
    [key: string]: string | number;
  };
  [key: string]: any; // For any additional properties
}

interface TradingViewWidget {
  new (configuration: TradingViewWidgetOptions): any;
}

interface Window {
  TradingView: {
    widget: TradingViewWidget;
  };
}