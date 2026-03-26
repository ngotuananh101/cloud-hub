<?php
 
namespace App\Http\Controllers;
 
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;
 
class ActivityController extends Controller
{
    public function index()
    {
        $activities = Activity::where('causer_id', \Illuminate\Support\Facades\Auth::id())
            ->latest()
            ->paginate(10);
 
        return response()->json($activities);
    }
}
