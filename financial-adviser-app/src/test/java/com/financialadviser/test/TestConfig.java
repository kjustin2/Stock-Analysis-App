package com.financialadviser.test;

import org.junit.jupiter.api.extension.BeforeAllCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.testfx.framework.junit5.ApplicationExtension;

import javafx.application.Platform;

public class TestConfig implements BeforeAllCallback {
    
    private static boolean initialized = false;
    
    @Override
    public void beforeAll(ExtensionContext context) throws Exception {
        if (!initialized) {
            // Initialize JavaFX Platform only once
            if (!Platform.isFxApplicationThread() && !Platform.isImplicitExit()) {
                try {
                    Platform.startup(() -> {});
                } catch (IllegalStateException e) {
                    // Toolkit already initialized, ignore
                }
            }
            
            // Register shutdown hook to clean up JavaFX Platform
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                if (Platform.isFxApplicationThread()) {
                    Platform.exit();
                }
            }));
            
            initialized = true;
        }
    }
} 