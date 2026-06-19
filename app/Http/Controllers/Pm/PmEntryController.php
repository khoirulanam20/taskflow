<?php

namespace App\Http\Controllers\Pm;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class PmEntryController extends Controller
{
    public function __invoke(): RedirectResponse
    {
        return redirect()->route('pm.workspaces.index');
    }
}
