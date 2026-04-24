// enseñar sobre la conexión entre el HTML y el JS (getElementById)
// enseñar sobre async
document.getElementById('calcForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const num1 = document.getElementById('num1').value;
    const num2 = document.getElementById('num2').value;
    const operation = document.getElementById('operation').value;
  
    //enseñar sobre métodos get, post y estructura de JSON
    //enseñar sobre fetch
    const response = await fetch('/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num1, num2, operation }),
    });
  //enseñar sobre modificar el HTML
    const data = await response.json();
    document.getElementById('result').textContent = data.result;
  });

document.addEventListener('DOMContentLoaded', function() {
            const container = document.getElementById('periodRowsContainer');
            const addBtn = document.getElementById('addPeriodBtn');
            
            // Add first row by default
            addPeriodRow();
            
            addBtn.addEventListener('click', addPeriodRow);
            
            function addPeriodRow() {
                const rowId = Date.now(); // Unique ID for each row
                const row = document.createElement('div');
                row.className = 'period-row row g-3';
                row.id = `periodRow-${rowId}`;
                
                row.innerHTML = `
                    <div class="col-md-7">
                        <label for="periodDesc-${rowId}" class="form-label">Period Description</label>
                        <input type="text" class="form-control" id="periodDesc-${rowId}" 
                               placeholder="e.g. Summer 2020, Jan-Mar 2021" required>
                    </div>
                    <div class="col-md-3">
                        <label for="kwh-${rowId}" class="form-label">kWh Consumed</label>
                        <input type="number" class="form-control" id="kwh-${rowId}" 
                               placeholder="0" required>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button type="button" class="btn btn-danger btn-remove w-100" 
                                onclick="removePeriodRow('periodRow-${rowId}')">
                            <i class="bi bi-trash"></i> Remove
                        </button>
                    </div>
                `;
                
                container.appendChild(row);
            }
            
            // Form submission handler
            document.getElementById('consumptionForm').addEventListener('submit', function(e) {
                e.preventDefault();
                // Here you would process the form data
                alert('Form data would be processed for ROI calculation');
            });
        });
        
        // Global function to remove rows
        function removePeriodRow(rowId) {
            const rows = document.querySelectorAll('.period-row');
            if (rows.length > 1) {
                document.getElementById(rowId).remove();
            } else {
                alert("You need at least one consumption period.");
            }
        }