# Dock

The dock is the primary app switcher. It is built in `client/src/desktop/Dock.tsx` and driven by `DOCK_APPS` in `client/src/desktop/apps.tsx`.

## Items

The curated order is:

```
Finder · Gallery · Projects · Journal · Contact · Music · ARENA AI · Terminal · GitHub · System Settings │ Trash
```

System Settings and Trash are appended by the dock rather than listed in `DOCK_APPS`, which prevents the duplicate Settings and Trash entries that appeared in earlier builds. The separator is a real element, so Trash remains visually separate.

## Interaction

| Action | Result |
| --- | --- |
| Click a running app | Focus its topmost window |
| Click a minimized app | Restore its window |
| Click a closed app | Launch it |
| Hover | Tooltip with the app label |
| Move the pointer | Distance-based magnification |
| Right side | Trash shows discarded desktop icons |

Magnification uses each item's bounding box, a 170 px influence radius and a spring animation. It is disabled below 860 px and can be turned off in System Settings or the View menu.

## Glass

The container uses:

- `rounded-[22px]`, a 1 px white border and a light translucent fill;
- `backdrop-blur-2xl` plus `backdrop-saturate-150`;
- a long soft shadow and an inset highlight for the top edge.

Icons keep their own artwork; the dock no longer paints colored gradient tiles behind custom icons.

## Running state

A white dot under an icon marks a running app. The focused app receives a subtle ring. The ARENA AI icon keeps its green availability dot.

## Reduced motion

Dock magnification is a preference (`dockMagnify`). Users who prefer reduced motion can disable it in System Settings, and the OS `prefers-reduced-motion` handling in `index.css` removes non-essential transitions.
