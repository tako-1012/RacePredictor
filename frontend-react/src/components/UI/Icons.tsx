'use client'

import React from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Clock, 
  MapPin, 
  Trophy, 
  Target, 
  Activity,
  Zap,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  User,
  LogOut,
  Home,
  BarChart3,
  TrendingUp,
  Award,
  Flag,
  Timer,
  Heart,
  Gauge,
  Route,
  Navigation,
  Play,
  Pause,
  Square,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Copy,
  Save,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  Archive,
  Grid,
  List,
  Menu,
  MoreHorizontal,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Palette,
  Layers,
  Bell,
  BellOff,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share,
  Bookmark,
  BookmarkCheck,
  Users,
  Bug,
  Lightbulb,
  Shield,
  Mail,
  Printer
} from 'lucide-react'

// アイコンサイズの統一
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40
} as const

export type IconSize = keyof typeof ICON_SIZES

// アイコン色の統一
export const ICON_COLORS = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  info: 'text-blue-500',
  muted: 'text-gray-400',
  white: 'text-white',
  black: 'text-black'
} as const

export type IconColor = keyof typeof ICON_COLORS

// 統一されたアイコンコンポーネント
interface IconProps {
  name: keyof typeof iconMap
  size?: IconSize
  color?: IconColor
  className?: string
}

const iconMap = {
  // 基本操作
  plus: Plus,
  edit: Edit,
  delete: Trash2,
  view: Eye,
  calendar: Calendar,
  clock: Clock,
  location: MapPin,
  trophy: Trophy,
  target: Target,
  activity: Activity,
  zap: Zap,
  
  // ナビゲーション
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  
  // 検索・フィルター
  search: Search,
  filter: Filter,
  
  // ファイル操作
  download: Download,
  upload: Upload,
  save: Save,
  copy: Copy,
  
  // 設定・ユーザー
  settings: Settings,
  user: User,
  logout: LogOut,
  home: Home,
  users: Users,
  
  // 統計・分析
  barChart: BarChart3,
  trendingUp: TrendingUp,
  award: Award,
  flag: Flag,
  timer: Timer,
  heart: Heart,
  gauge: Gauge,
  route: Route,
  navigation: Navigation,
  
  // メディア制御
  play: Play,
  pause: Pause,
  stop: Square,
  refresh: RefreshCw,
  
  // 状態
  check: Check,
  x: X,
  alertCircle: AlertCircle,
  info: Info,
  checkCircle: CheckCircle,
  xCircle: XCircle,
  alertTriangle: AlertTriangle,
  helpCircle: HelpCircle,
  externalLink: ExternalLink,
  
  // ファイル・フォルダ
  file: FileText,
  fileText: FileText,
  fileImage: FileImage,
  fileVideo: FileVideo,
  fileAudio: FileAudio,
  filePdf: FileSpreadsheet,
  fileSpreadsheet: FileSpreadsheet,
  folder: Folder,
  folderOpen: FolderOpen,
  archive: Archive,
  
  // レイアウト
  grid: Grid,
  list: List,
  menu: Menu,
  moreHorizontal: MoreHorizontal,
  moreVertical: MoreVertical,
  
  // 表示制御
  maximize: Maximize,
  minimize: Minimize,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
  
  // その他
  sun: Sun,
  moon: Moon,
  palette: Palette,
  layers: Layers,
  bell: Bell,
  bellOff: BellOff,
  star: Star,
  thumbsUp: ThumbsUp,
  thumbsDown: ThumbsDown,
  messageCircle: MessageCircle,
  share: Share,
  bookmark: Bookmark,
  bookmarkCheck: BookmarkCheck,
  
  // 新しく追加されたアイコン
  bug: Bug,
  lightbulb: Lightbulb,
  shield: Shield,
  mail: Mail,
  printer: Printer
} as const

export function Icon({ name, size = 'md', color = 'secondary', className = '' }: IconProps) {
  const IconComponent = iconMap[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }
  
  const sizeValue = ICON_SIZES[size]
  const colorClass = ICON_COLORS[color]
  
  return (
    <IconComponent 
      size={sizeValue} 
      className={`${colorClass} ${className}`}
    />
  )
}

// よく使用されるアイコンのショートカット
export const Icons = {
  // 基本操作
  Plus: (props: Omit<IconProps, 'name'>) => <Icon name="plus" {...props} />,
  Edit: (props: Omit<IconProps, 'name'>) => <Icon name="edit" {...props} />,
  Delete: (props: Omit<IconProps, 'name'>) => <Icon name="delete" {...props} />,
  View: (props: Omit<IconProps, 'name'>) => <Icon name="view" {...props} />,
  Calendar: (props: Omit<IconProps, 'name'>) => <Icon name="calendar" {...props} />,
  Clock: (props: Omit<IconProps, 'name'>) => <Icon name="clock" {...props} />,
  Location: (props: Omit<IconProps, 'name'>) => <Icon name="location" {...props} />,
  Trophy: (props: Omit<IconProps, 'name'>) => <Icon name="trophy" {...props} />,
  Target: (props: Omit<IconProps, 'name'>) => <Icon name="target" {...props} />,
  Activity: (props: Omit<IconProps, 'name'>) => <Icon name="activity" {...props} />,
  Zap: (props: Omit<IconProps, 'name'>) => <Icon name="zap" {...props} />,
  
  // ナビゲーション
  ChevronRight: (props: Omit<IconProps, 'name'>) => <Icon name="chevronRight" {...props} />,
  ChevronLeft: (props: Omit<IconProps, 'name'>) => <Icon name="chevronLeft" {...props} />,
  ChevronUp: (props: Omit<IconProps, 'name'>) => <Icon name="chevronUp" {...props} />,
  ChevronDown: (props: Omit<IconProps, 'name'>) => <Icon name="chevronDown" {...props} />,
  
  // 検索・フィルター
  Search: (props: Omit<IconProps, 'name'>) => <Icon name="search" {...props} />,
  Filter: (props: Omit<IconProps, 'name'>) => <Icon name="filter" {...props} />,
  
  // ファイル操作
  Download: (props: Omit<IconProps, 'name'>) => <Icon name="download" {...props} />,
  Upload: (props: Omit<IconProps, 'name'>) => <Icon name="upload" {...props} />,
  Save: (props: Omit<IconProps, 'name'>) => <Icon name="save" {...props} />,
  Copy: (props: Omit<IconProps, 'name'>) => <Icon name="copy" {...props} />,
  
  // 設定・ユーザー
  Settings: (props: Omit<IconProps, 'name'>) => <Icon name="settings" {...props} />,
  User: (props: Omit<IconProps, 'name'>) => <Icon name="user" {...props} />,
  LogOut: (props: Omit<IconProps, 'name'>) => <Icon name="logout" {...props} />,
  Home: (props: Omit<IconProps, 'name'>) => <Icon name="home" {...props} />,
  
  // 統計・分析
  BarChart: (props: Omit<IconProps, 'name'>) => <Icon name="barChart" {...props} />,
  TrendingUp: (props: Omit<IconProps, 'name'>) => <Icon name="trendingUp" {...props} />,
  Award: (props: Omit<IconProps, 'name'>) => <Icon name="award" {...props} />,
  Flag: (props: Omit<IconProps, 'name'>) => <Icon name="flag" {...props} />,
  Timer: (props: Omit<IconProps, 'name'>) => <Icon name="timer" {...props} />,
  Heart: (props: Omit<IconProps, 'name'>) => <Icon name="heart" {...props} />,
  Gauge: (props: Omit<IconProps, 'name'>) => <Icon name="gauge" {...props} />,
  Route: (props: Omit<IconProps, 'name'>) => <Icon name="route" {...props} />,
  Navigation: (props: Omit<IconProps, 'name'>) => <Icon name="navigation" {...props} />,
  
  // メディア制御
  Play: (props: Omit<IconProps, 'name'>) => <Icon name="play" {...props} />,
  Pause: (props: Omit<IconProps, 'name'>) => <Icon name="pause" {...props} />,
  Stop: (props: Omit<IconProps, 'name'>) => <Icon name="stop" {...props} />,
  Refresh: (props: Omit<IconProps, 'name'>) => <Icon name="refresh" {...props} />,
  
  // 状態
  Check: (props: Omit<IconProps, 'name'>) => <Icon name="check" {...props} />,
  X: (props: Omit<IconProps, 'name'>) => <Icon name="x" {...props} />,
  AlertCircle: (props: Omit<IconProps, 'name'>) => <Icon name="alertCircle" {...props} />,
  Info: (props: Omit<IconProps, 'name'>) => <Icon name="info" {...props} />,
  CheckCircle: (props: Omit<IconProps, 'name'>) => <Icon name="checkCircle" {...props} />,
  XCircle: (props: Omit<IconProps, 'name'>) => <Icon name="xCircle" {...props} />,
  AlertTriangle: (props: Omit<IconProps, 'name'>) => <Icon name="alertTriangle" {...props} />,
  HelpCircle: (props: Omit<IconProps, 'name'>) => <Icon name="helpCircle" {...props} />,
  ExternalLink: (props: Omit<IconProps, 'name'>) => <Icon name="externalLink" {...props} />,
  
  // ファイル・フォルダ
  File: (props: Omit<IconProps, 'name'>) => <Icon name="file" {...props} />,
  FileText: (props: Omit<IconProps, 'name'>) => <Icon name="fileText" {...props} />,
  FileImage: (props: Omit<IconProps, 'name'>) => <Icon name="fileImage" {...props} />,
  FileVideo: (props: Omit<IconProps, 'name'>) => <Icon name="fileVideo" {...props} />,
  FileAudio: (props: Omit<IconProps, 'name'>) => <Icon name="fileAudio" {...props} />,
  FilePdf: (props: Omit<IconProps, 'name'>) => <Icon name="filePdf" {...props} />,
  FileSpreadsheet: (props: Omit<IconProps, 'name'>) => <Icon name="fileSpreadsheet" {...props} />,
  Folder: (props: Omit<IconProps, 'name'>) => <Icon name="folder" {...props} />,
  FolderOpen: (props: Omit<IconProps, 'name'>) => <Icon name="folderOpen" {...props} />,
  Archive: (props: Omit<IconProps, 'name'>) => <Icon name="archive" {...props} />,
  
  // レイアウト
  Grid: (props: Omit<IconProps, 'name'>) => <Icon name="grid" {...props} />,
  List: (props: Omit<IconProps, 'name'>) => <Icon name="list" {...props} />,
  Menu: (props: Omit<IconProps, 'name'>) => <Icon name="menu" {...props} />,
  MoreHorizontal: (props: Omit<IconProps, 'name'>) => <Icon name="moreHorizontal" {...props} />,
  MoreVertical: (props: Omit<IconProps, 'name'>) => <Icon name="moreVertical" {...props} />,
  
  // 表示制御
  Maximize: (props: Omit<IconProps, 'name'>) => <Icon name="maximize" {...props} />,
  Minimize: (props: Omit<IconProps, 'name'>) => <Icon name="minimize" {...props} />,
  ZoomIn: (props: Omit<IconProps, 'name'>) => <Icon name="zoomIn" {...props} />,
  ZoomOut: (props: Omit<IconProps, 'name'>) => <Icon name="zoomOut" {...props} />,
  
  // その他
  Sun: (props: Omit<IconProps, 'name'>) => <Icon name="sun" {...props} />,
  Moon: (props: Omit<IconProps, 'name'>) => <Icon name="moon" {...props} />,
  Palette: (props: Omit<IconProps, 'name'>) => <Icon name="palette" {...props} />,
  Layers: (props: Omit<IconProps, 'name'>) => <Icon name="layers" {...props} />,
  Bell: (props: Omit<IconProps, 'name'>) => <Icon name="bell" {...props} />,
  BellOff: (props: Omit<IconProps, 'name'>) => <Icon name="bellOff" {...props} />,
  Star: (props: Omit<IconProps, 'name'>) => <Icon name="star" {...props} />,
  ThumbsUp: (props: Omit<IconProps, 'name'>) => <Icon name="thumbsUp" {...props} />,
  ThumbsDown: (props: Omit<IconProps, 'name'>) => <Icon name="thumbsDown" {...props} />,
  MessageCircle: (props: Omit<IconProps, 'name'>) => <Icon name="messageCircle" {...props} />,
  Share: (props: Omit<IconProps, 'name'>) => <Icon name="share" {...props} />,
  Bookmark: (props: Omit<IconProps, 'name'>) => <Icon name="bookmark" {...props} />,
  BookmarkCheck: (props: Omit<IconProps, 'name'>) => <Icon name="bookmarkCheck" {...props} />,
  
  // 新しく追加されたアイコン
  Users: (props: Omit<IconProps, 'name'>) => <Icon name="users" {...props} />,
  Bug: (props: Omit<IconProps, 'name'>) => <Icon name="bug" {...props} />,
  Lightbulb: (props: Omit<IconProps, 'name'>) => <Icon name="lightbulb" {...props} />,
  Shield: (props: Omit<IconProps, 'name'>) => <Icon name="shield" {...props} />,
  Mail: (props: Omit<IconProps, 'name'>) => <Icon name="mail" {...props} />,
  Printer: (props: Omit<IconProps, 'name'>) => <Icon name="printer" {...props} />
} as const