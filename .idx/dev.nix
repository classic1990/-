{ pkgs, ... }: {
  packages = [
    pkgs.nodejs_22
    pkgs.pnpm
    pkgs.firebase-tools
  ];
}
