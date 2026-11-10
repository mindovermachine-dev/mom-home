# Community-maintained Nix image; all repo tooling is baked in with Nix.
FROM nixos/nix:latest

# Nixpkgs revision/branch used to resolve every tool below; bump to update.
ARG NIXPKGS=github:NixOS/nixpkgs/nixos-25.05

RUN printf 'experimental-features = nix-command flakes\nsandbox = false\n' >> /etc/nix/nix.conf

RUN nix profile install \
      "${NIXPKGS}#gnused" \
      "${NIXPKGS}#gawk" \
      "${NIXPKGS}#procps" \
      "${NIXPKGS}#nano" \
      "${NIXPKGS}#gh" \
      "${NIXPKGS}#nodejs_22" \
      "${NIXPKGS}#markdownlint-cli2" \
      "${NIXPKGS}#nodePackages.prettier" \
      "${NIXPKGS}#stdenv.cc.cc.lib" \
      "${NIXPKGS}#glibc" \
 && nix-collect-garbage -d

# The VS Code server and other prebuilt binaries expect a standard glibc loader and libstdc++.
RUN mkdir -p /lib64 /lib \
 && for f in /root/.nix-profile/lib/ld-linux-*.so.*; do ln -sf "$f" "/lib64/$(basename "$f")"; ln -sf "$f" "/lib/$(basename "$f")"; done \
 && for f in /root/.nix-profile/lib/libstdc++.so.6 /root/.nix-profile/lib/libgcc_s.so.1; do ln -sf "$f" "/lib/$(basename "$f")"; done \
 && ln -sf /root/.nix-profile/bin/bash /bin/bash

ENV PATH=/root/.nix-profile/bin:/opt/npm-global/bin:$PATH \
    NODE_PATH=/opt/npm-global/lib/node_modules \
    NPM_CONFIG_PREFIX=/opt/npm-global \
    SSL_CERT_FILE=/root/.nix-profile/etc/ssl/certs/ca-bundle.crt \
    GIT_SSL_CAINFO=/root/.nix-profile/etc/ssl/certs/ca-bundle.crt \
    EDITOR=nano \
    ASTRO_TELEMETRY_DISABLED=1

# cspell and its Danish dictionary (neither is packaged in nixpkgs), referenced by .cspell.jsonc.
RUN npm install -g cspell @cspell/dict-da-dk

WORKDIR /workspaces/mom-doc-theme
CMD ["sleep", "infinity"]
