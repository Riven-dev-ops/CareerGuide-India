package com.careerguide.app

import android.annotation.SuppressLint
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.Environment
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.provider.MediaStore
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import java.io.IOException

/**
 * MainActivity
 * ------------
 * Hosts a single WebView that loads the fully-offline site bundled under
 * app/src/main/assets/www/. Everything — the landing page, the game-based
 * assessment, and the recommendation engine — runs locally in JavaScript,
 * so this app needs no internet connection and no backend server.
 *
 * Exposes the `AndroidBridge` interface to allow the HTML5 results page
 * to programmatically trigger a PDF download directly to the system's
 * Downloads directory.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    private val createPdfLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val uri = result.data?.data
            if (uri != null) {
                writeWebViewToPdf(uri)
            } else {
                Toast.makeText(this, "Failed to save PDF: No URI returned", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true          // required for sessionStorage (results handoff)
            allowFileAccess = true
            allowContentAccess = true
            cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
        }

        // Bind the JavaScript interface
        webView.addJavascriptInterface(AndroidBridge(), "AndroidBridge")

        webView.webViewClient = WebViewClient()
        webView.loadUrl("file:///android_asset/www/index.html")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    /**
     * JavaScript Bridge to handle events triggered from results.html.
     */
    inner class AndroidBridge {
        @JavascriptInterface
        fun printPage() {
            runOnUiThread {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    savePdfDirectlyToDownloads()
                } else {
                    savePdfWithFileChooser()
                }
            }
        }

        @JavascriptInterface
        fun getGroqApiKey(): String {
            return BuildConfig.GROQ_API_KEY
        }
    }

    /**
     * For Android 10+ (API 29+), saves the WebView to the public Downloads directory
     * programmatically using MediaStore, without triggering any file picker UI.
     */
    @androidx.annotation.RequiresApi(Build.VERSION_CODES.Q)
    private fun savePdfDirectlyToDownloads() {
        val resolver = contentResolver
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, "CareerGuide_Report.pdf")
            put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
        }

        val uri = try {
            resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
        } catch (e: Exception) {
            Log.e("MainActivity", "Failed to insert into MediaStore", e)
            null
        }

        if (uri == null) {
            Toast.makeText(this, "Failed to save PDF to Downloads", Toast.LENGTH_LONG).show()
            return
        }

        writeWebViewToPdf(uri)
    }

    /**
     * For older Android versions (API < 29), launches the Storage Access Framework (SAF)
     * file chooser to let the user save the PDF file without needing runtime storage permissions.
     */
    private fun savePdfWithFileChooser() {
        val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "application/pdf"
            putExtra(Intent.EXTRA_TITLE, "CareerGuide_Report.pdf")
        }
        try {
            createPdfLauncher.launch(intent)
        } catch (e: Exception) {
            Log.e("MainActivity", "Failed to launch file chooser", e)
            Toast.makeText(this, "Failed to create PDF: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Renders the WebView's content using its PrintDocumentAdapter and writes
     * the generated PDF stream into the provided Uri's file descriptor.
     */
    private fun writeWebViewToPdf(uri: Uri) {
        val pfd = try {
            contentResolver.openFileDescriptor(uri, "w")
        } catch (e: Exception) {
            Log.e("MainActivity", "Failed to open file descriptor", e)
            Toast.makeText(this, "Failed to write PDF file: ${e.message}", Toast.LENGTH_SHORT).show()
            return
        }

        if (pfd == null) {
            Toast.makeText(this, "Failed to write PDF: File descriptor is null", Toast.LENGTH_SHORT).show()
            return
        }

        val printAttributes = PrintAttributes.Builder()
            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
            .setResolution(PrintAttributes.Resolution("pdf", "pdf", 600, 600))
            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
            .build()

        val printAdapter = webView.createPrintDocumentAdapter("CareerGuide_Report")

        printAdapter.onLayout(
            null,
            printAttributes,
            null,
            object : android.print.PrintHelper.LayoutCallbackWrapper() {
                override fun onLayoutFinished(info: PrintDocumentInfo?, changed: Boolean) {
                    printAdapter.onWrite(
                        arrayOf(PageRange.ALL_PAGES),
                        pfd,
                        CancellationSignal(),
                        object : android.print.PrintHelper.WriteCallbackWrapper() {
                            override fun onWriteFinished(pages: Array<out PageRange>?) {
                                super.onWriteFinished(pages)
                                try {
                                    pfd.close()
                                    Toast.makeText(this@MainActivity, "PDF downloaded successfully to Downloads folder!", Toast.LENGTH_LONG).show()
                                } catch (e: IOException) {
                                    Log.e("MainActivity", "Failed to close file descriptor", e)
                                }
                            }

                            override fun onWriteFailed(error: CharSequence?) {
                                super.onWriteFailed(error)
                                cleanUpFailedSave(pfd, uri)
                                Toast.makeText(this@MainActivity, "PDF generation failed: $error", Toast.LENGTH_LONG).show()
                            }

                            override fun onWriteCancelled() {
                                super.onWriteCancelled()
                                cleanUpFailedSave(pfd, uri)
                                Toast.makeText(this@MainActivity, "PDF generation cancelled", Toast.LENGTH_SHORT).show()
                            }
                        }
                    )
                }

                override fun onLayoutFailed(error: CharSequence?) {
                    super.onLayoutFailed(error)
                    cleanUpFailedSave(pfd, uri)
                    Toast.makeText(this@MainActivity, "PDF layout failed: $error", Toast.LENGTH_LONG).show()
                }

                override fun onLayoutCancelled() {
                    super.onLayoutCancelled()
                    cleanUpFailedSave(pfd, uri)
                    Toast.makeText(this@MainActivity, "PDF layout cancelled", Toast.LENGTH_SHORT).show()
                }
            },
            null
        )
    }

    private fun cleanUpFailedSave(pfd: ParcelFileDescriptor, uri: Uri) {
        try {
            pfd.close()
        } catch (e: IOException) {
            // ignore
        }
        try {
            contentResolver.delete(uri, null, null)
        } catch (e: Exception) {
            Log.w("MainActivity", "Failed to delete empty PDF uri after print failure", e)
        }
    }
}
