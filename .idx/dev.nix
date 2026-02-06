# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.pnpm # Add pnpm
    pkgs.corepack # Add corepack to manage pnpm version
    pkgs.esbuild
  ];

  # Sets environment variables in the workspace
  env = {};

  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "google.gemini-cli-vscode-ide-companion"
    ];

    # Enable previews.
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["pnpm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
          manager = "web";
          workingDirectory = "./duydodee-hd";
        };
      };
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        # Enable corepack to manage the pnpm version specified in package.json
        enable-corepack = "corepack enable";
        pnpm-install = "cd duydodee-hd && pnpm install";
        # Open editors for the following files by default, if they exist:
        default.openFiles = [ ".idx/dev.nix" "README.md" ];
      };

      # Runs when the workspace is (re)started
      onStart = {
        # The dev server is now handled by the preview configuration.
      };
    };
  };
}
