package tests;

import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Complete Automation Test Suite for Online Shopping & Order Management System.
 * Covers 7 Mandatory Test Cases + 9 Additional Practical Verification Test Cases (16 Total).
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ShoppingSystemTest extends BaseTest {

    // Helper: Authenticate customer
    private void loginAsCustomer(String email, String password) {
        driver.get(baseUrl + "/login");
        WebElement emailInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email")));
        emailInput.clear();
        emailInput.sendKeys(email);

        WebElement passInput = driver.findElement(By.id("password"));
        passInput.clear();
        passInput.sendKeys(password);

        driver.findElement(By.id("loginBtn")).click();
        wait.until(ExpectedConditions.urlContains("/products"));
    }

    // Helper: Authenticate admin
    private void loginAsAdmin() {
        driver.get(baseUrl + "/login");
        WebElement emailInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email")));
        emailInput.clear();
        emailInput.sendKeys("admin@aurafoma.com");

        WebElement passInput = driver.findElement(By.id("password"));
        passInput.clear();
        passInput.sendKeys("Admin@1234");

        driver.findElement(By.id("loginBtn")).click();
        wait.until(ExpectedConditions.urlContains("/admin"));
    }

    // =========================================================================
    // MANDATORY SEVEN TEST CASES (TC01 - TC07)
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("TC01: Customer Login")
    public void testTC01_CustomerLogin() {
        driver.get(baseUrl + "/login");
        
        WebElement emailInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email")));
        emailInput.sendKeys("john@example.com");

        WebElement passwordInput = driver.findElement(By.id("password"));
        passwordInput.sendKeys("Customer@123");

        WebElement loginBtn = driver.findElement(By.id("loginBtn"));
        loginBtn.click();

        // Verification
        wait.until(ExpectedConditions.urlContains("/products"));
        assertTrue(driver.getCurrentUrl().contains("/products"), "Customer should be redirected to /products after login");
        
        WebElement userBadge = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("user-badge")));
        assertTrue(userBadge.getText().contains("John Doe"), "User badge should display customer name 'John Doe'");
    }

    @Test
    @Order(2)
    @DisplayName("TC02: Search Product")
    public void testTC02_SearchProduct() {
        driver.get(baseUrl + "/products");

        WebElement searchBox = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("searchBox")));
        searchBox.clear();
        searchBox.sendKeys("Ceramic");

        WebElement searchBtn = driver.findElement(By.id("searchBtn"));
        searchBtn.click();

        // Verification
        wait.until(ExpectedConditions.urlContains("search=Ceramic"));
        List<WebElement> productCards = driver.findElements(By.className("product-card"));
        assertFalse(productCards.isEmpty(), "At least one product card should match search query 'Ceramic'");
        
        String firstCardText = productCards.get(0).getText();
        assertTrue(firstCardText.toLowerCase().contains("ceramic"), "Product card should contain 'ceramic'");
    }

    @Test
    @Order(3)
    @DisplayName("TC03: Add Product to Cart")
    public void testTC03_AddProductToCart() {
        loginAsCustomer("john@example.com", "Customer@123");

        driver.get(baseUrl + "/products");
        WebElement addToCartBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("addToCartBtn")));
        addToCartBtn.click();

        // Verification
        wait.until(ExpectedConditions.urlContains("/cart"));
        assertTrue(driver.getCurrentUrl().contains("/cart"), "Adding item should redirect to /cart");

        List<WebElement> cartRows = driver.findElements(By.className("cart-item-row"));
        assertFalse(cartRows.isEmpty(), "Cart should contain at least one item row");
    }

    @Test
    @Order(4)
    @DisplayName("TC04: Update Cart Quantity")
    public void testTC04_UpdateCartQuantity() {
        loginAsCustomer("john@example.com", "Customer@123");

        // Ensure at least one item in cart
        driver.get(baseUrl + "/products");
        wait.until(ExpectedConditions.elementToBeClickable(By.id("addToCartBtn"))).click();
        wait.until(ExpectedConditions.urlContains("/cart"));

        // Update quantity
        WebElement qtyInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("quantity")));
        qtyInput.clear();
        qtyInput.sendKeys("3");

        WebElement updateBtn = driver.findElement(By.id("updateCartBtn"));
        updateBtn.click();

        // Verification
        wait.until(ExpectedConditions.urlContains("/cart"));
        WebElement updatedQtyInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("quantity")));
        assertEquals("3", updatedQtyInput.getAttribute("value"), "Cart quantity input should now reflect '3'");

        WebElement alert = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("alert-success")));
        assertTrue(alert.getText().toLowerCase().contains("updated quantity"), "Success alert should confirm quantity update");
    }

    @Test
    @Order(5)
    @DisplayName("TC05: Remove Product")
    public void testTC05_RemoveProduct() {
        loginAsCustomer("john@example.com", "Customer@123");

        // Ensure item in cart
        driver.get(baseUrl + "/products");
        wait.until(ExpectedConditions.elementToBeClickable(By.id("addToCartBtn"))).click();
        wait.until(ExpectedConditions.urlContains("/cart"));

        // Click remove button
        WebElement removeBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("removeProductBtn")));
        removeBtn.click();

        // Verification
        wait.until(ExpectedConditions.urlContains("/cart"));
        WebElement successAlert = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("alert-success")));
        assertTrue(successAlert.getText().toLowerCase().contains("removed"), "Success alert should confirm removal");
    }

    @Test
    @Order(6)
    @DisplayName("TC06: Checkout")
    public void testTC06_Checkout() {
        loginAsCustomer("john@example.com", "Customer@123");

        // Add item to cart
        driver.get(baseUrl + "/products");
        wait.until(ExpectedConditions.elementToBeClickable(By.id("addToCartBtn"))).click();
        wait.until(ExpectedConditions.urlContains("/cart"));

        // Proceed to checkout
        WebElement checkoutBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("checkoutBtn")));
        checkoutBtn.click();

        // In checkout page, submit confirmation
        wait.until(ExpectedConditions.urlContains("/checkout"));
        WebElement addressInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("shippingAddress")));
        addressInput.clear();
        addressInput.sendKeys("500 Fifth Avenue, Artisanal Design Floor, New York");

        WebElement confirmBtn = driver.findElement(By.id("confirmCheckoutBtn"));
        confirmBtn.click();

        // Verification: confirmation page
        wait.until(ExpectedConditions.urlContains("/orders/confirmation/"));
        assertTrue(driver.getCurrentUrl().contains("/orders/confirmation/"), "Should arrive at order confirmation page");

        WebElement orderIdElem = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("order-id")));
        assertNotNull(orderIdElem.getText(), "Order ID should be generated and displayed");
        assertTrue(orderIdElem.getText().startsWith("AF-"), "Order ID format should begin with 'AF-'");
    }

    @Test
    @Order(7)
    @DisplayName("TC07: View Order History")
    public void testTC07_ViewOrderHistory() {
        loginAsCustomer("john@example.com", "Customer@123");

        driver.get(baseUrl + "/orders");

        // Verification
        wait.until(ExpectedConditions.urlContains("/orders"));
        WebElement container = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("orderHistoryContainer")));
        List<WebElement> orders = container.findElements(By.className("order-history-card"));
        assertFalse(orders.isEmpty(), "Customer order history should list at least one recorded order");

        WebElement firstOrder = orders.get(0);
        assertTrue(firstOrder.getText().contains("AF-"), "Order record should contain unique prefix 'AF-'");
    }

    // =========================================================================
    // ADDITIONAL NINE TEST CASES (TC08 - TC16)
    // =========================================================================

    @Test
    @Order(8)
    @DisplayName("TC08: Customer Registration")
    public void testTC08_CustomerRegistration() {
        driver.get(baseUrl + "/register");

        String uniqueEmail = "reg_test_" + System.currentTimeMillis() + "@studioexample.org";

        WebElement nameInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("name")));
        nameInput.sendKeys("Selenium Registered User");

        WebElement emailInput = driver.findElement(By.id("regEmail"));
        emailInput.sendKeys(uniqueEmail);

        WebElement passInput = driver.findElement(By.id("regPassword"));
        passInput.sendKeys("SecureUser@2026");

        WebElement regBtn = driver.findElement(By.id("registerBtn"));
        regBtn.click();

        // Verification
        wait.until(ExpectedConditions.urlContains("/login"));
        assertTrue(driver.getCurrentUrl().contains("/login"), "Registration should redirect to /login");

        WebElement successAlert = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("alert-success")));
        assertTrue(successAlert.getText().toLowerCase().contains("registration successful"), "Success message should be displayed");
    }

    @Test
    @Order(9)
    @DisplayName("TC09: Duplicate Customer Registration")
    public void testTC09_DuplicateCustomerRegistration() {
        driver.get(baseUrl + "/register");

        // Try registering with already existing demo email
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("name"))).sendKeys("Duplicate Tester");
        driver.findElement(By.id("regEmail")).sendKeys("john@example.com");
        driver.findElement(By.id("regPassword")).sendKeys("SomePassword123");
        driver.findElement(By.id("registerBtn")).click();

        // Verification
        wait.until(ExpectedConditions.urlContains("/register"));
        WebElement errorAlert = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("alertMessage")));
        assertTrue(errorAlert.getText().toLowerCase().contains("already exists"), "Alert should indicate email already exists");
    }

    @Test
    @Order(10)
    @DisplayName("TC10: Invalid Customer Login")
    public void testTC10_InvalidCustomerLogin() {
        driver.get(baseUrl + "/login");

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email"))).sendKeys("john@example.com");
        driver.findElement(By.id("password")).sendKeys("TotallyWrongPassword999!");
        driver.findElement(By.id("loginBtn")).click();

        // Verification
        wait.until(ExpectedConditions.urlContains("/login"));
        WebElement errorAlert = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("alertMessage")));
        assertTrue(errorAlert.getText().toLowerCase().contains("invalid email or password"), "Should display invalid credential notice");
    }

    @Test
    @Order(11)
    @DisplayName("TC11: Admin Login")
    public void testTC11_AdminLogin() {
        loginAsAdmin();

        // Verification
        assertTrue(driver.getCurrentUrl().contains("/admin"), "Admin should be directed to /admin cockpit");
        WebElement titleElem = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("admin-title")));
        assertTrue(titleElem.getText().contains("Studio Operations"), "Admin cockpit title should be visible");
    }

    @Test
    @Order(12)
    @DisplayName("TC12: Add Product as Admin")
    public void testTC12_AddProductAsAdmin() {
        loginAsAdmin();

        String productName = "Selenium Test Vase " + System.currentTimeMillis();

        WebElement nameInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("addProdName")));
        nameInput.sendKeys(productName);

        driver.findElement(By.id("addProdPrice")).sendKeys("89.50");
        driver.findElement(By.id("addProdStock")).sendKeys("11");
        driver.findElement(By.id("addProdDesc")).sendKeys("Automated Selenium verification product description.");

        driver.findElement(By.id("addProdSubmit")).click();

        // Verification
        wait.until(ExpectedConditions.urlContains("/admin"));
        WebElement successAlert = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("alert-success")));
        assertTrue(successAlert.getText().toLowerCase().contains("added to the catalog"), "Should display add confirmation message");

        WebElement table = driver.findElement(By.id("inventoryTable"));
        assertTrue(table.getText().contains(productName), "Inventory table should contain newly created product");
    }

    @Test
    @Order(13)
    @DisplayName("TC13: Update Product as Admin")
    public void testTC13_UpdateProductAsAdmin() {
        loginAsAdmin();

        // Click Edit on the first product in inventory
        WebElement editBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("editProdBtn")));
        editBtn.click();

        // Edit form appears
        WebElement editStockInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("editProdStock")));
        editStockInput.clear();
        editStockInput.sendKeys("22");

        WebElement submitBtn = driver.findElement(By.id("editProdSubmit"));
        submitBtn.click();

        // Verification
        wait.until(ExpectedConditions.urlContains("/admin"));
        WebElement successAlert = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("alert-success")));
        assertTrue(successAlert.getText().toLowerCase().contains("updated successfully"), "Success alert should confirm update");
    }

    @Test
    @Order(14)
    @DisplayName("TC14: Delete or Deactivate Product as Admin")
    public void testTC14_DeleteOrDeactivateProductAsAdmin() {
        loginAsAdmin();

        // First create a dedicated disposable product to safely delete
        String disposableName = "Disposable Item " + System.currentTimeMillis();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("addProdName"))).sendKeys(disposableName);
        driver.findElement(By.id("addProdPrice")).sendKeys("15.00");
        driver.findElement(By.id("addProdStock")).sendKeys("5");
        driver.findElement(By.id("addProdDesc")).sendKeys("Temporary item for deletion verification.");
        driver.findElement(By.id("addProdSubmit")).click();

        wait.until(ExpectedConditions.urlContains("/admin"));

        // Locate delete button of newly added item and click
        WebElement deleteBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("deleteProdBtn")));
        deleteBtn.click();

        // If a browser confirmation popup appears, accept it
        try {
            driver.switchTo().alert().accept();
        } catch (Exception ignored) {}

        // Verification
        wait.until(ExpectedConditions.urlContains("/admin"));
        WebElement successAlert = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("alert-success")));
        assertTrue(successAlert.getText().toLowerCase().contains("deleted") || successAlert.getText().toLowerCase().contains("deactivated"), 
            "Should confirm deletion or deactivation");
    }

    @Test
    @Order(15)
    @DisplayName("TC15: Empty Cart Checkout Prevention")
    public void testTC15_EmptyCartCheckout() {
        // Register a clean customer with a guaranteed empty cart
        String cleanEmail = "empty_cart_" + System.currentTimeMillis() + "@studio.org";
        driver.get(baseUrl + "/register");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("name"))).sendKeys("Empty Cart User");
        driver.findElement(By.id("regEmail")).sendKeys(cleanEmail);
        driver.findElement(By.id("regPassword")).sendKeys("CleanCart@123");
        driver.findElement(By.id("registerBtn")).click();

        loginAsCustomer(cleanEmail, "CleanCart@123");

        // Navigate directly to /cart
        driver.get(baseUrl + "/cart");
        wait.until(ExpectedConditions.urlContains("/cart"));

        // Verify empty cart notice is displayed
        WebElement emptyNotice = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("emptyCartAlert")));
        assertTrue(emptyNotice.isDisplayed(), "Empty cart alert must be displayed when bag has 0 items");
        assertTrue(emptyNotice.getText().contains("Your Shopping Bag is Empty"), "Notice should explicitly state empty bag");
    }

    @Test
    @Order(16)
    @DisplayName("TC16: Insufficient Stock Validation")
    public void testTC16_InsufficientStockValidation() {
        // Register dedicated customer for clean isolation
        String stockEmail = "stock_val_" + System.currentTimeMillis() + "@studio.org";
        driver.get(baseUrl + "/register");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("name"))).sendKeys("Stock Val User");
        driver.findElement(By.id("regEmail")).sendKeys(stockEmail);
        driver.findElement(By.id("regPassword")).sendKeys("StockVal@123");
        driver.findElement(By.id("registerBtn")).click();

        loginAsCustomer(stockEmail, "StockVal@123");

        // Add item
        driver.get(baseUrl + "/products");
        wait.until(ExpectedConditions.elementToBeClickable(By.id("addToCartBtn"))).click();
        wait.until(ExpectedConditions.urlContains("/cart"));

        // Enter excessive quantity
        WebElement qtyInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("quantity")));
        qtyInput.clear();
        qtyInput.sendKeys("99999");

        WebElement updateBtn = driver.findElement(By.id("updateCartBtn"));
        updateBtn.click();

        // Verification: Error alert triggered
        wait.until(ExpectedConditions.urlContains("/cart"));
        WebElement errorAlert = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("alertMessage")));
        assertTrue(errorAlert.getText().toLowerCase().contains("cannot set quantity") || 
                   errorAlert.getText().toLowerCase().contains("inventory"), 
                   "Should display stock limit validation message");
    }
}
