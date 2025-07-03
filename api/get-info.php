<?php
header('Content-Type: application/json');
include '../db/connection.php';

if (!isset($_GET['id'])) {
    echo json_encode(['error' => 'Missing ID']);
    exit;
}

$id = $_GET['id'];

// Use a prepared statement
$query = "
    SELECT su.id, su.name, su.uid, su.type, su.group_name,
           p.party_type, p.name AS party_name, p.address, p.email, p.phone,
           r.rrr_type, r.ownership_type,
           su.vertical_extent
    FROM spatial_unit su
    LEFT JOIN party p ON su.pid = p.pid
    LEFT JOIN rrr r ON su.id = r.spatial_unit_id
    WHERE su.id = $1
    LIMIT 1
";

try {
    $stmt = pg_prepare($conn, "get_info", $query);
    $result = pg_execute($conn, "get_info", [$id]);

    if (!$result) {
        echo json_encode(['error' => 'Query failed']);
        exit;
    }

    $data = pg_fetch_assoc($result);

    if (!$data) {
        echo json_encode(['error' => 'No record found for id: ' . $id]);
    } else {
        echo json_encode($data);
    }
} catch (Exception $e) {
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
} 
