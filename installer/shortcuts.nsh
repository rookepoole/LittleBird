!macro customInstall
  Delete "$DESKTOP\Little Bird.lnk"
  Delete "$SMPROGRAMS\Little Bird.lnk"
  RMDir /r "$SMPROGRAMS\Little Bird"
  CreateShortCut "$DESKTOP\Little Bird.lnk" "$INSTDIR\Little Bird.exe" "" "$INSTDIR\Little Bird.exe" 0
  CreateShortCut "$SMPROGRAMS\Little Bird.lnk" "$INSTDIR\Little Bird.exe" "" "$INSTDIR\Little Bird.exe" 0
!macroend

!macro customUnInstall
  Delete "$DESKTOP\Little Bird.lnk"
  Delete "$SMPROGRAMS\Little Bird.lnk"
  RMDir /r "$SMPROGRAMS\Little Bird"
!macroend
