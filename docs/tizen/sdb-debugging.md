# SDB debugging

Purpose:
Help agents debug Tizen TV web apps using SDB, Tizen Studio, and device logs.

Read first:
- docs/tizen/source-map.md

Official sources:
- docs/vendor/samsung-tizen-docs/docs/application/web/tutorials/process/run-debug-app.md
- docs/vendor/samsung-tizen-docs/docs/application/tizen-studio/

Common tasks:
- connect to TV
- inspect installed apps
- install or uninstall a WGT
- launch app
- view logs
- capture app runtime errors

Agent rules:
- do not assume Android adb behavior
- do not suggest reinstalling unless explicitly requested
- prefer log collection and reproduction steps
- report exact commands and observed output

## Common Command Reference

### Connect to Emulator/TV
```powershell
# Connect to TV or emulator instance
sdb connect <IP_ADDRESS>:26101

# Check connected devices list
sdb devices
```

### List Installed Applications
```powershell
sdb shell 0 vd_applist
```

### Launch and Debug Applications
```powershell
# Launch an app normally
sdb shell 0 was_execute <AppID>

# Launch an app in Web Debugger mode (returns the debug port)
sdb shell 0 debug <AppID>
```

### Port Forwarding
```powershell
# List active port forwardings
sdb forward --list

# Forward target debug port to local host
sdb forward tcp:<port> tcp:<port>
```
