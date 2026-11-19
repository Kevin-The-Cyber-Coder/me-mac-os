# Keyboard shortcuts

Shortcuts use `⌘` on macOS and `Ctrl` elsewhere. The handler in `client/src/desktop/DesktopEnvironment.tsx` ignores keystrokes while the user is typing in an input, textarea, select or content-editable element.

## Global

| Keys | Action |
| --- | --- |
| `⌘/Ctrl + K` | Open Spotlight |
| `⌘/Ctrl + W` | Close the focused window |
| `⌘/Ctrl + M` | Minimize the focused window |
| `⌘/Ctrl + ,` | Open System Settings |
| `⌘/Ctrl + \`` | Cycle windows |
| `Esc` | Close overlays and menus |
| `⌘/Ctrl + 1…9` | Launch the matching dock app |

## Spotlight

| Keys | Action |
| --- | --- |
| `↑` / `↓` | Move the active result |
| `Enter` | Run the active result |
| `Esc` | Close Spotlight |

## Desktop

| Keys | Action |
| --- | --- |
| `Enter` / `Space` | Open the selected desktop icon |
| Drag | Move an icon and persist its position |
| Right click | Context menu |

## Terminal

| Keys | Action |
| --- | --- |
| `↑` / `↓` | Command history |
| `Tab` | Complete a command |
| `Enter` | Run a command |

The same list is available inside the desktop in **Shortcuts** (`/shortcuts`) and **Help → Keyboard Shortcuts**. The app reads the OS at runtime, so labels switch between `⌘` and `Ctrl` automatically.
