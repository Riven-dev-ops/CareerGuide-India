package android.print;

import android.print.PrintDocumentAdapter.LayoutResultCallback;
import android.print.PrintDocumentAdapter.WriteResultCallback;

public class PrintHelper {
    public static abstract class LayoutCallbackWrapper extends LayoutResultCallback {
        public LayoutCallbackWrapper() {
            super();
        }
    }

    public static abstract class WriteCallbackWrapper extends WriteResultCallback {
        public WriteCallbackWrapper() {
            super();
        }
    }
}
