# Menu bar

`client/src/desktop/MenuBar.tsx` implements the 30 px system bar. It is a menu host, a status display and the entry point for Spotlight and Control Center.

## Layout

```
 Apple  <active app>  File  Edit  View  Go  Window  Help        status  clock
```

- The Apple button opens the system menu.
- The bold app name reflects the focused window and opens the same system menu, matching macOS.
- File, Edit, View, Go, Window and Help are real menus; every item performs an action or is explicitly disabled.
- The right side keeps a small, native-looking set: Wi-Fi, battery, Spotlight, Control Center and the clock.

Earlier builds added Bluetooth, volume, now-playing, notification and account chips. Those controls now live in Control Center, the app itself or the system menu, which keeps the bar honest without dropping functionality.

## Menus

| Menu | Highlights |
| --- | --- |
| Apple | About This Mac, System Settings, Force Quit, Restart, Close All Apps, admin session |
| File | Finder, ARENA AI, résumé download, close window/all |
| Edit | Copy selection, Spotlight, keyboard shortcuts |
| View | theme, reduce motion, dock autohide, desktop icons, widgets, full screen, wallpaper |
| Go | every portfolio surface |
| Window | minimize, zoom, cycle, bring all to front, show desktop |
| Help | shortcuts, about, contact, ARENA help, about this Mac |

## Clock

`Wed Nov 19 10:24 AM` — the date is hidden below the `lg` breakpoint and the time uses tabular numerals. Clicking the clock opens a month calendar and the current date.

## Panels

Wi-Fi, battery, clock and Force Quit render in `MenuPanel`, a translucent popover. Every panel closes on outside click or Escape. Control Center and Notification Center are separate overlays rendered by the desktop shell.
