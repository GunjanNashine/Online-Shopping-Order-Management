package tests;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/**
 * BaseTest provides WebDriver initialization, common wait configurations,
 * and standard cleanup routines for the Selenium test suite.
 */
public abstract class BaseTest {

    protected WebDriver driver;
    protected WebDriverWait wait;
    protected String baseUrl;

    @BeforeEach
    public void setUp() {
        // Read base URL from system property (-DbaseUrl=http://localhost:3000) or default to localhost:3000
        baseUrl = System.getProperty("baseUrl");
        if (baseUrl == null || baseUrl.trim().isEmpty()) {
            baseUrl = "http://localhost:3000";
        }
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        // Verify application server is reachable before attempting to launch browser
        try {
            java.net.URL url = new java.net.URI(baseUrl).toURL();
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(2000);
            conn.setReadTimeout(2000);
            conn.setRequestMethod("GET");
            conn.connect();
            conn.getResponseCode();
            conn.disconnect();
        } catch (Exception e) {
            System.err.println("\n==========================================================================");
            System.err.println("❌ ERROR: APPLICATION SERVER IS NOT REACHABLE AT: " + baseUrl);
            System.err.println("👉 Please open a separate terminal and start the server first:");
            System.err.println("   cd C:\\Users\\rupes\\Desktop\\Devopslab\\Online-Shopping-Order-Management");
            System.err.println("   npm start");
            System.err.println("==========================================================================\n");
            org.junit.jupiter.api.Assertions.fail(
                "Application server is NOT running at " + baseUrl + 
                ". Start the server first with 'npm start' in another terminal."
            );
        }

        // Configure ChromeOptions
        ChromeOptions options = new ChromeOptions();

        // Check if headless mode should be used (default to true for CI/DevOps reliability)
        String headlessProp = System.getProperty("headless");
        boolean isHeadless = headlessProp == null || !headlessProp.equalsIgnoreCase("false");

        if (isHeadless) {
            options.addArguments("--headless=new");
        }

        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--remote-allow-origins=*");
        options.addArguments("--window-size=1920,1080");

        // Selenium Manager automatically resolves and configures compatible ChromeDriver
        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(20));

        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) {
            try {
                driver.quit();
            } catch (Exception e) {
                System.err.println("Notice during WebDriver teardown: " + e.getMessage());
            }
        }
    }
}
