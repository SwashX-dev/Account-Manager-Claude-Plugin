{
  description = "Claude Account Manager: Firefox container extension and development environment";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      eachSystem = nixpkgs.lib.genAttrs systems;
      forSystem = system:
        let
          pkgs = import nixpkgs { inherit system; };
          source = pkgs.lib.cleanSourceWith {
            src = ./.;
            filter = path: type:
              let name = baseNameOf path;
              in !(builtins.elem name [ ".git" "node_modules" "dist" "result" ]);
          };
          extension = pkgs.stdenvNoCC.mkDerivation {
            pname = "claude-account-manager";
            version = "0.1.0";
            src = source;
            nativeBuildInputs = [ pkgs.nodejs_22 ];
            dontConfigure = true;
            buildPhase = ''
              runHook preBuild
              node scripts/validate.js
              node scripts/build.js
              runHook postBuild
            '';
            doCheck = true;
            checkPhase = ''
              runHook preCheck
              node --test
              runHook postCheck
            '';
            installPhase = ''
              runHook preInstall
              mkdir -p "$out/share/claude-account-manager"
              cp -r extension "$out/share/claude-account-manager/"
              cp dist/*.zip "$out/share/claude-account-manager/"
              runHook postInstall
            '';
            meta = {
              description = "Unsigned Firefox extension for independent Claude web account spaces";
              license = pkgs.lib.licenses.mit;
              platforms = systems;
            };
          };
        in {
          packages.default = extension;
          checks.default = extension;
          devShells.default = pkgs.mkShell {
            packages = [ pkgs.nodejs_22 pkgs.git ];
            shellHook = ''
              echo "Claude Account Manager: npm test; npm run lint; npm run build"
              echo "Firefox is installed separately. Builds are unsigned; see README."
            '';
          };
        };
    in {
      packages = eachSystem (system: (forSystem system).packages);
      checks = eachSystem (system: (forSystem system).checks);
      devShells = eachSystem (system: (forSystem system).devShells);
    };
}
