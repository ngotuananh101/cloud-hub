<?php
 
namespace App\Http\Controllers;
 
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;
 
class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->input('limit', 10);
 
        $activities = Activity::where('causer_id', \Illuminate\Support\Facades\Auth::id())
            ->latest()
            ->paginate($limit);
 
        return response()->json($activities);
    }
}
