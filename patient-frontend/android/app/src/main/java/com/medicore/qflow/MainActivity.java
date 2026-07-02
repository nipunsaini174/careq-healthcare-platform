package com.medicore.qflow;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        
        // 1. Enable Edge-to-Edge
        WindowCompat.setDecorFitsSystemWindows(window, false);
        
        // 2. Make bars transparent
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        // 3. Configure System UI Controller
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, window.getDecorView());
        
        // Use white icons for the status bar (better for the teal background)
        controller.setAppearanceLightStatusBars(false);
        
        // HIDE the system navigation bar (the back/home buttons/bar at the bottom)
        // This removes the "previous unused thing" that was overlapping.
        controller.hide(WindowInsetsCompat.Type.navigationBars());
        
        // Make it so the user can swipe up to show the navigation bar temporarily
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
