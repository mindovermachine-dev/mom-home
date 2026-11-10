{
  description = "Nix packages for the Mind over Machine devcontainer";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    gh-tt-src = {
      url = "github:devx-cafe/gh-tt/868a79b050f3ac59e85e4744220e3f5aee3adc85";
      flake = false;
    };
  };

  outputs = { nixpkgs, gh-tt-src, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];

      packagesFor = system:
        let
          pkgs = import nixpkgs { inherit system; };

          ghInsituAssets = {
            "x86_64-linux" = {
              name = "gh-insitu-linux-amd64";
              sha256 = "981bcf5f7c9dc72e2411eae2661abaa2670a1079f5b344cf0a89d86c3c347192";
            };
            "aarch64-linux" = {
              name = "gh-insitu-linux-arm64";
              sha256 = "1a76bcc30aae79f4d968595f5e3043440c16fcdb770a454ca30510a41094ccbc";
            };
          };

          ghInsituAsset = ghInsituAssets.${system};

          ghInsitu = pkgs.stdenvNoCC.mkDerivation {
            pname = "gh-insitu";
            version = "0.9.2";
            src = pkgs.fetchurl {
              url = "https://github.com/devx-cafe/gh-insitu/releases/download/0.9.2/${ghInsituAsset.name}";
              sha256 = ghInsituAsset.sha256;
            };
            dontUnpack = true;
            installPhase = ''
              install -Dm755 "$src" "$out/bin/gh-insitu"
            '';
          };

          cspellDictDaDk = pkgs.stdenvNoCC.mkDerivation {
            pname = "cspell-dict-da-dk";
            version = "4.1.3";
            src = pkgs.fetchurl {
              url = "https://registry.npmjs.org/@cspell/dict-da-dk/-/dict-da-dk-4.1.3.tgz";
              hash = "sha512-/zYWQNluJa7UFlYs6iFWNK6yBnlAbwHU/tIVEWhu9og15bf/6RE7b/3wm8VzbvdKA77u8MR6p/9KL2eKe5GtOg==";
            };
            dontUnpack = true;
            nativeBuildInputs = [ pkgs.gnutar ];
            installPhase = ''
              installDir="$out/lib/node_modules/@cspell/dict-da-dk"
              mkdir -p "$installDir"
              tar -xzf "$src" --strip-components=1 -C "$installDir"
            '';
          };

          cspell = pkgs.runCommand "cspell-with-danish-dictionary" {
            nativeBuildInputs = [ pkgs.makeWrapper ];
          } ''
            mkdir -p "$out/bin"
            makeWrapper "${pkgs.cspell}/bin/cspell" "$out/bin/cspell" \
              --prefix NODE_PATH : "${cspellDictDaDk}/lib/node_modules"
          '';

          ghTt = pkgs.runCommand "gh-tt" {
            nativeBuildInputs = [ pkgs.makeWrapper ];
          } ''
            mkdir -p "$out/bin"
            makeWrapper "${pkgs.python3}/bin/python3" "$out/bin/gh-tt" \
              --add-flags "${gh-tt-src}/gh-tt"
          '';
        in
        {
          inherit cspell ghInsitu ghTt;
          cspell-dict-da-dk = cspellDictDaDk;
          gh-insitu = ghInsitu;
          gh-tt = ghTt;
        };
    in
    {
      packages = nixpkgs.lib.genAttrs systems packagesFor;
    };
}