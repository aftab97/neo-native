const { withGradleProperties, withAndroidManifest } = require("expo/config-plugins");

/**
 * Config plugin to fix AndroidX/Support Library conflicts
 * This addresses the manifest merger error where androidx.core conflicts with com.android.support
 */
function withAndroidXFix(config) {
  // Add Jetifier to gradle.properties
  config = withGradleProperties(config, (config) => {
    const jetifierProp = config.modResults.find(
      (prop) => prop.type === "property" && prop.key === "android.enableJetifier"
    );

    if (!jetifierProp) {
      config.modResults.push({
        type: "property",
        key: "android.enableJetifier",
        value: "true",
      });
    }

    return config;
  });

  // Add tools:replace to AndroidManifest for debug builds
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];

    if (application) {
      // Ensure the tools namespace is present
      if (!manifest.manifest.$["xmlns:tools"]) {
        manifest.manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
      }

      // Add tools:replace attribute to handle appComponentFactory conflict
      const existingReplace = application.$["tools:replace"] || "";
      if (!existingReplace.includes("android:appComponentFactory")) {
        application.$["tools:replace"] = existingReplace
          ? `${existingReplace},android:appComponentFactory`
          : "android:appComponentFactory";
      }
    }

    return config;
  });

  return config;
}

module.exports = withAndroidXFix;
