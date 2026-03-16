{
  pkgs ? import <nixpkgs> { },
}:

pkgs.appimageTools.wrapType2 {
  pname = "ganache";
  version = "2.7.1";

  # Ensure this points to the exact name of your downloaded AppImage
  src = ./ganache-2.7.1-linux-x86_64.AppImage;

  # Inject the missing library into the AppImage's environment
  extraPkgs =
    pkgs: with pkgs; [
      xorg.libxshmfence
    ];
}
