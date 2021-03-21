.PHONY: build build-prod clean

build:
	npx babel source --out-dir build/
	cp -rv build/* ./

build-prod:
	npx babel source/ --no-comments --out-file dist/subspace-client.js
	npx babel source/ --presets=babel-preset-minify --no-comments --out-file dist/subspace-client.min.js

dependencies:
	npm install

clean:
	rm -rf ./*.js
